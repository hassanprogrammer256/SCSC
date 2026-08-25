import uuid

from django.db import models

from personnel.models import DirectingStaffProfile, OfficerProfile
from scheduling.models import AssessmentSchedule


class Submission(models.Model):
    class FileType(models.TextChoices):
        DOCX = "docx", "DOCX"
        PDF = "pdf", "PDF"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(AssessmentSchedule, on_delete=models.CASCADE, related_name="submissions")
    officer = models.ForeignKey(OfficerProfile, on_delete=models.CASCADE, related_name="submissions")
    file_url = models.CharField(max_length=512)
    file_type = models.CharField(max_length=8, choices=FileType.choices)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_late = models.BooleanField(default=False)
    # Cached parsed docx/pdf text — populated lazily the first time a
    # plagiarism check needs it (either as the submission being checked, or
    # as another officer's comparison source), never re-extracted after
    # that. See assessments/services/plagiarism.py.
    extracted_text = models.TextField(blank=True, null=True)

    @property
    def course(self):
        return self.assessment.activity.course

    def __str__(self):
        return f"{self.officer} — {self.assessment.activity.name}"


class Mark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(AssessmentSchedule, on_delete=models.CASCADE, related_name="marks")
    officer = models.ForeignKey(OfficerProfile, on_delete=models.CASCADE, related_name="marks")
    score = models.DecimalField(max_digits=5, decimal_places=2)
    remarks = models.TextField(blank=True)
    comments = models.TextField(blank=True)
    is_complete = models.BooleanField(default=False)
    marked_by = models.ForeignKey(DirectingStaffProfile, on_delete=models.SET_NULL, null=True, related_name="marks_given")
    marked_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("assessment", "officer")

    @property
    def course(self):
        return self.assessment.activity.course

    def __str__(self):
        return f"{self.officer} — {self.assessment.activity.name}: {self.score}"


class AssessmentReport(models.Model):
    """A DS's written report to Admin once marking for an Activity's
    assessment is complete — project-overview.md's DS Workflow step 5 /
    build-plan.md Phase 6 feature 26. No schema for this existed anywhere in
    architecture.md; designed fresh here, kept deliberately minimal (one
    body field) since no richer shape is specified anywhere in the docs.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(AssessmentSchedule, on_delete=models.CASCADE, related_name="reports")
    directing_staff = models.ForeignKey(DirectingStaffProfile, on_delete=models.CASCADE, related_name="submitted_reports")
    body = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    @property
    def course(self):
        return self.assessment.activity.course

    def __str__(self):
        return f"{self.directing_staff} — {self.assessment.activity.name} report"


class PlagiarismReport(models.Model):
    """DS-triggered only — see assessments/services/plagiarism.py. Never
    created automatically at Submission upload time; NOT_CHECKED is the
    state before any DS has run a check, not an in-progress state (the
    check itself runs synchronously within one request/response).
    """

    class Status(models.TextChoices):
        NOT_CHECKED = "not_checked", "Not Checked"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name="plagiarism_report")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.NOT_CHECKED)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    # Ordered list of every sentence in the submission, in original order:
    # {"text", "band" ("plagiarised"|"paraphrased"|"original"),
    # "similarity_percent", "source": {...} | None}. Lets the frontend
    # reconstruct the full submission text with inline colored highlights
    # and a per-span source, instead of just a whole-document score.
    highlights = models.JSONField(default=list, blank=True)
    # Whether the external (Google Programmable Search) step actually ran
    # this check — false if unconfigured or the daily query quota was
    # already spent; internal (cohort) comparison always still runs either way.
    external_checked = models.BooleanField(default=False)
    checked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.submission} — {self.status}"


class ExternalSearchQuota(models.Model):
    """Tracks Google Programmable Search JSON API usage per calendar day —
    the free tier caps at 100 queries/day project-wide (not per DS, not per
    check). A plagiarism check that would exceed
    settings.PLAGIARISM_EXTERNAL_DAILY_QUOTA silently skips external
    comparison for that run rather than failing — internal (cohort)
    comparison always still runs. See assessments/services/web_search.py.
    """

    date = models.DateField(unique=True)
    query_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.date}: {self.query_count} queries"
