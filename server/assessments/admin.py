from django.contrib import admin

from assessments.models import Mark, PlagiarismReport, Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["officer", "assessment", "file_type", "submitted_at", "is_late"]
    list_filter = ["file_type", "is_late"]


@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display = ["officer", "assessment", "score", "is_complete", "marked_by", "marked_at"]
    list_filter = ["is_complete"]


@admin.register(PlagiarismReport)
class PlagiarismReportAdmin(admin.ModelAdmin):
    list_display = ["submission", "status", "score", "checked_at"]
    list_filter = ["status"]
