import logging

import requests
from django.conf import settings
from django.db.models import F
from django.utils import timezone

from assessments.models import ExternalSearchQuota

logger = logging.getLogger(__name__)

GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"


def has_quota_remaining(count_needed: int) -> bool:
    today = timezone.localdate()
    quota, _ = ExternalSearchQuota.objects.get_or_create(date=today)
    return quota.query_count + count_needed <= settings.PLAGIARISM_EXTERNAL_DAILY_QUOTA


def record_query_usage(count: int) -> None:
    today = timezone.localdate()
    ExternalSearchQuota.objects.get_or_create(date=today)
    ExternalSearchQuota.objects.filter(date=today).update(query_count=F("query_count") + count)


def search_snippets(query: str, num: int = 3) -> list[dict]:
    """Searches Google Programmable Search for an exact-phrase match on
    `query` and returns the top results' URL/title/snippet only — never
    fetches the actual page. Fetching arbitrary external pages ourselves
    would add a lot of failure surface (paywalls, bot-blocking, JS-rendered
    content); the search snippet is enough to confirm a phrase appears on a
    page and to give the DS a link to verify manually. Fails closed (empty
    list) on missing credentials or any request error, same pattern as
    EgoSms/Gmail in announcements/services/ — never raises into the caller.
    """
    if not settings.GOOGLE_SEARCH_API_KEY or not settings.GOOGLE_SEARCH_CSE_ID:
        return []
    try:
        response = requests.get(
            GOOGLE_SEARCH_URL,
            params={
                "key": settings.GOOGLE_SEARCH_API_KEY,
                "cx": settings.GOOGLE_SEARCH_CSE_ID,
                "q": f'"{query}"',
                "num": num,
            },
            timeout=10,
        )
        response.raise_for_status()
        items = response.json().get("items", [])
        return [
            {"url": item.get("link", ""), "title": item.get("title", ""), "snippet": item.get("snippet", "")}
            for item in items
        ]
    except requests.RequestException:
        logger.exception("[assessments/web_search] Google Programmable Search request failed")
        return []
