import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

from django.conf import settings
from django.core.files.storage import default_storage
from django.utils import timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from assessments.models import PlagiarismReport, Submission
from assessments.services.text_extraction import extract_text
from assessments.services.web_search import has_quota_remaining, record_query_usage, search_snippets

logger = logging.getLogger(__name__)

# A sentence shorter than this is never flagged — short/generic phrases
# ("See Appendix A.") produce noisy, meaningless TF-IDF similarity scores.
MIN_SENTENCE_WORDS = 5
PLAGIARISED_THRESHOLD = 75.0
PARAPHRASED_THRESHOLD = 40.0
# How many of a submission's most distinctive sentences get an external
# (web) search — capped low because Google's free tier is 100 queries/day
# project-wide, not per check. See context/architecture.md's Plagiarism
# Service notes / web_search.py.
EXTERNAL_SENTENCES_PER_CHECK = 10
EXTERNAL_MIN_SENTENCE_WORDS = 8

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])")


def split_sentences(text: str) -> list[str]:
    """Simple rule-based sentence splitter — no NLP dependency. Splits on
    ./!/? followed by whitespace and a capital letter/digit/quote. Known
    limitation: doesn't special-case abbreviations (e.g. "Lt. Col.", "e.g."),
    so those occasionally over-split — acceptable since it only affects
    highlight granularity, not the correctness of the underlying similarity
    comparison.
    """
    normalized = re.sub(r"\s+", " ", text or "").strip()
    if not normalized:
        return []
    parts = _SENTENCE_SPLIT_RE.split(normalized)
    return [p.strip() for p in parts if len(p.strip()) > 1]


def _extract_submission_text(submission: Submission) -> str | None:
    # file_url holds the storage-relative name (dev: local path, prod: the
    # environment's own file reference) — see context/architecture.md's
    # Submission.file_url notes. default_storage.path() resolves it to an
    # absolute filesystem path for local (dev) storage; Cloudinary (prod)
    # doesn't support .path() and would need a download step here once that
    # storage backend is wired up for submissions.
    return extract_text(default_storage.path(submission.file_url), submission.file_type)


def get_or_extract_text(submission: Submission) -> str | None:
    """Cache-aware text extraction — see Submission.extracted_text. Never
    caches a failed extraction (leaves the field blank), so a transient
    failure can still be retried on a later check.
    """
    if submission.extracted_text:
        return submission.extracted_text
    text = _extract_submission_text(submission)
    if text and text.strip():
        submission.extracted_text = text
        submission.save(update_fields=["extracted_text"])
        return text
    return None


def warm_cohort_cache(other_submissions: list[Submission]) -> None:
    """Extracts+caches text for every submission in `other_submissions` that
    isn't cached yet. On an assessment's first-ever check this eagerly pays
    the whole cohort's extraction cost in one request; every check after
    that (any officer, any DS) is a no-op here since the fields are already
    populated — a one-time tax per assessment, not per check.
    """
    for other in other_submissions:
        if not other.extracted_text:
            get_or_extract_text(other)


def _band_for(similarity_percent: float) -> str:
    if similarity_percent >= PLAGIARISED_THRESHOLD:
        return "plagiarised"
    if similarity_percent >= PARAPHRASED_THRESHOLD:
        return "paraphrased"
    return "original"


def _internal_matches(query_sentences: list[str], other_sentences_by_submission: dict[str, list[str]]) -> list[dict | None]:
    """Returns, per query sentence (same order/length as query_sentences),
    the best-matching (similarity_percent, submission_id) found across every
    other submission's sentences on this assessment, or None if nothing
    scored above zero. One shared TF-IDF vocabulary across the whole
    combined corpus, same tool as the original whole-document version, just
    applied sentence-to-sentence.
    """
    flat_others = [(sid, sentence) for sid, sentences in other_sentences_by_submission.items() for sentence in sentences]
    if not flat_others:
        return [None] * len(query_sentences)

    corpus = query_sentences + [sentence for _, sentence in flat_others]
    try:
        vectors = TfidfVectorizer(stop_words="english").fit_transform(corpus)
    except ValueError:
        # Empty vocabulary after stopword removal (e.g. an all-stopword
        # corpus) — degrade to "no internal matches this run" rather than
        # failing the whole check.
        return [None] * len(query_sentences)

    query_vectors = vectors[: len(query_sentences)]
    other_vectors = vectors[len(query_sentences) :]
    similarity_matrix = cosine_similarity(query_vectors, other_vectors)

    results: list[dict | None] = []
    for row in similarity_matrix:
        best_idx = row.argmax()
        best_score = row[best_idx]
        if best_score <= 0:
            results.append(None)
            continue
        submission_id, _ = flat_others[best_idx]
        results.append({"similarity": float(best_score) * 100, "submission_id": submission_id})
    return results


def _select_distinctive_sentences(sentences: list[str]) -> list[str]:
    candidates = [s for s in sentences if len(s.split()) >= EXTERNAL_MIN_SENTENCE_WORDS]
    candidates.sort(key=lambda s: len(s.split()), reverse=True)
    return candidates[:EXTERNAL_SENTENCES_PER_CHECK]


def _best_snippet_match(sentence: str, hits: list[dict]) -> dict | None:
    if not hits:
        return None
    corpus = [sentence] + [hit["snippet"] for hit in hits]
    try:
        vectors = TfidfVectorizer(stop_words="english").fit_transform(corpus)
    except ValueError:
        return None
    similarities = cosine_similarity(vectors[0:1], vectors[1:]).flatten()
    best_idx = similarities.argmax()
    best_score = similarities[best_idx]
    if best_score <= 0:
        return None
    hit = hits[best_idx]
    return {"similarity": float(best_score) * 100, "url": hit["url"], "title": hit["title"], "snippet": hit["snippet"]}


def _external_matches(selected_sentences: list[str]) -> tuple[dict[str, dict], bool]:
    """Returns (results keyed by sentence text, whether the external step
    actually ran). Doesn't run at all if unconfigured or the daily quota is
    already spent — internal comparison is unaffected either way. Quota is
    charged for the attempt regardless of whether any result comes back, and
    charged up front (not per successful call) since a failed/empty search
    still consumes the API's daily allowance.
    """
    if not selected_sentences:
        return {}, False
    if not settings.GOOGLE_SEARCH_API_KEY or not settings.GOOGLE_SEARCH_CSE_ID:
        return {}, False
    if not has_quota_remaining(len(selected_sentences)):
        return {}, False
    record_query_usage(len(selected_sentences))

    results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_sentence = {executor.submit(search_snippets, sentence): sentence for sentence in selected_sentences}
        for future in as_completed(future_to_sentence):
            sentence = future_to_sentence[future]
            try:
                hits = future.result()
            except Exception:
                logger.exception("[assessments/plagiarism] external search failed for one sentence")
                hits = []
            best = _best_snippet_match(sentence, hits)
            if best:
                results[sentence] = best
    return results, True


def _compute_score(highlights: list[dict]) -> float:
    """Word-weighted percentage of the submission flagged as plagiarised or
    paraphrased — weighted by word count rather than sentence count, so a
    few long copied sentences and many short original ones aren't
    misrepresented either direction.
    """
    total_words = sum(len(h["text"].split()) for h in highlights)
    if total_words == 0:
        return 0.0
    flagged_words = sum(len(h["text"].split()) for h in highlights if h["band"] != "original")
    return round(flagged_words / total_words * 100, 1)


def run_plagiarism_check(submission: Submission) -> PlagiarismReport:
    """DS-triggered only — never called automatically at Submission upload
    time. Runs synchronously; cohort sizes are small enough (tens of
    officers) that this stays fast, especially once the cohort's text is
    cached (see warm_cohort_cache) — only the very first check on a given
    assessment pays the full extraction cost. Always safe to re-run: fully
    overwrites the previous report, including a fresh external-quota spend.
    """
    report, _ = PlagiarismReport.objects.get_or_create(submission=submission)

    text = get_or_extract_text(submission)
    if text is None or not text.strip():
        report.status = PlagiarismReport.Status.FAILED
        report.checked_at = timezone.now()
        report.save()
        return report

    sentences = split_sentences(text)
    if not sentences:
        report.status = PlagiarismReport.Status.FAILED
        report.checked_at = timezone.now()
        report.save()
        return report

    other_submissions = list(
        Submission.objects.filter(assessment=submission.assessment)
        .exclude(pk=submission.pk)
        .select_related("officer__user")
    )
    warm_cohort_cache(other_submissions)

    other_sentences_by_submission: dict[str, list[str]] = {}
    officer_lookup = {}
    for other in other_submissions:
        if other.extracted_text:
            other_sentences_by_submission[str(other.id)] = split_sentences(other.extracted_text)
            officer_lookup[str(other.id)] = other.officer

    internal_results = _internal_matches(sentences, other_sentences_by_submission)

    distinctive = _select_distinctive_sentences(sentences)
    external_results, external_checked = _external_matches(distinctive)

    highlights = []
    for sentence, internal in zip(sentences, internal_results):
        candidates = []
        if internal:
            officer = officer_lookup.get(internal["submission_id"])
            candidates.append(
                {
                    "similarity": internal["similarity"],
                    "source": {
                        "type": "internal",
                        "submission_id": internal["submission_id"],
                        "officer_name": officer.user.full_name if officer else "",
                        "army_number": officer.user.army_number if officer else "",
                    },
                }
            )
        external = external_results.get(sentence)
        if external:
            candidates.append(
                {
                    "similarity": external["similarity"],
                    "source": {
                        "type": "external",
                        "url": external["url"],
                        "title": external["title"],
                        "snippet": external["snippet"],
                    },
                }
            )

        best = max(candidates, key=lambda c: c["similarity"]) if candidates else {"similarity": 0.0, "source": None}
        band = _band_for(best["similarity"]) if len(sentence.split()) >= MIN_SENTENCE_WORDS else "original"
        highlights.append(
            {
                "text": sentence,
                "band": band,
                "similarity_percent": round(best["similarity"], 1),
                "source": best["source"] if band != "original" else None,
            }
        )

    report.status = PlagiarismReport.Status.COMPLETED
    report.score = _compute_score(highlights)
    report.highlights = highlights
    report.external_checked = external_checked
    report.checked_at = timezone.now()
    report.save()
    return report
