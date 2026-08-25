from django.contrib import admin

from courses.models import Course, LandGroup


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["code", "start_year", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["code"]


@admin.register(LandGroup)
class LandGroupAdmin(admin.ModelAdmin):
    list_display = ["course", "name"]
    list_filter = ["name", "course"]
