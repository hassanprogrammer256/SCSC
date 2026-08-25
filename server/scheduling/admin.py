from django.contrib import admin

from scheduling.models import AssessmentSchedule, TimetableEntry


@admin.register(TimetableEntry)
class TimetableEntryAdmin(admin.ModelAdmin):
    list_display = ["activity", "land_group", "room", "start_at", "end_at"]
    list_filter = ["land_group", "room"]


@admin.register(AssessmentSchedule)
class AssessmentScheduleAdmin(admin.ModelAdmin):
    list_display = ["activity", "deadline"]
