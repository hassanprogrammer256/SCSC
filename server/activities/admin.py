from django.contrib import admin

from activities.models import Activity, ActivityAssignment


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["name", "course", "weight_percent", "is_mandatory"]
    list_filter = ["course"]
    search_fields = ["name"]


@admin.register(ActivityAssignment)
class ActivityAssignmentAdmin(admin.ModelAdmin):
    list_display = ["activity", "land_group", "directing_staff"]
    list_filter = ["land_group"]
