from decimal import Decimal

from activities.models import Activity
from assessments.models import Mark

ACTIVITY_GRADE_BANDS = [
    (80, 100, "Distinction"),
    (70, 79.99, "Merit"),
    (50, 69.99, "Pass"),
    (0, 49.99, "Fail"),
]

DEGREE_CLASS_BANDS = [
    (80, 100, "Pass with Distinction"),
    (65, 79.99, "Pass with Merit"),
    (50, 64.99, "Pass"),
    (0, 49.99, "Fail / Not Completed"),
]


def _band_label(value: float, bands: list[tuple[float, float, str]]) -> str:
    for low, high, label in bands:
        if low <= value <= high:
            return label
    return bands[-1][2]


# API responses return the band KEY ("distinction"/"merit"/"pass"/"fail"),
# matching the frontend's GradeBand type (client/src/types/index.ts) so the
# same value drives both color (GradeChip) and label (gradeBandLabel) there
# — the *_BANDS constants above keep the human-readable label text from
# context/code-standards.md verbatim; this mapping is purely a key alias.
_GRADE_LABEL_TO_KEY = {"Distinction": "distinction", "Merit": "merit", "Pass": "pass", "Fail": "fail"}
_DEGREE_LABEL_TO_KEY = {
    "Pass with Distinction": "distinction",
    "Pass with Merit": "merit",
    "Pass": "pass",
    "Fail / Not Completed": "fail",
}


def grade_for_score(score: Decimal) -> str:
    return _GRADE_LABEL_TO_KEY[_band_label(float(score), ACTIVITY_GRADE_BANDS)]


def degree_class_for_average(weighted_average: float) -> str:
    return _DEGREE_LABEL_TO_KEY[_band_label(weighted_average, DEGREE_CLASS_BANDS)]


# Grade/degree-class/progress are always computed at read time from Marks +
# Activity weights, never stored as editable fields — see
# context/architecture.md → Data Architecture Notes. No cache layer is
# wired up for this yet (LocMem/Redis exist for the project but aren't used
# here): computing on every read is simple, always-correct, and fast enough
# at this cohort size — revisit with caching only if it becomes a real cost.
def compute_officer_progress(officer_profile) -> dict:
    activities = list(Activity.objects.filter(course=officer_profile.course))
    marks = {
        m.assessment.activity_id: m
        for m in Mark.objects.filter(officer=officer_profile, assessment__activity__in=activities)
    }

    total_weight = sum(float(a.weight_percent) for a in activities)
    progress_percent = Decimal("0")
    weighted_score_sum = Decimal("0")
    activity_results = []
    all_mandatory_complete = bool(activities)

    for activity in activities:
        mark = marks.get(activity.id)
        if mark and mark.is_complete:
            progress_percent += activity.weight_percent
            weighted_score_sum += (mark.score * activity.weight_percent) / Decimal("100")
        elif activity.is_mandatory:
            all_mandatory_complete = False

        activity_results.append(
            {
                "activity_id": str(activity.id),
                "activity_name": activity.name,
                "weight_percent": float(activity.weight_percent),
                "score": float(mark.score) if mark else None,
                "grade": grade_for_score(mark.score) if mark else None,
                "is_complete": bool(mark and mark.is_complete),
                "remarks": mark.remarks if mark else None,
                "comments": mark.comments if mark else None,
            }
        )

    degree_class = None
    if all_mandatory_complete and total_weight > 0:
        degree_class = degree_class_for_average(float(weighted_score_sum))

    return {
        "activities": activity_results,
        "progress_percent": float(progress_percent),
        "weighted_average": float(weighted_score_sum) if all_mandatory_complete else None,
        "degree_class": degree_class,
    }
