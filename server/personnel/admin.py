from django.contrib import admin

from personnel.models import DirectingStaffProfile, OfficerProfile


@admin.register(OfficerProfile)
class OfficerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "course", "land_group"]
    list_filter = ["course", "land_group"]
    search_fields = ["user__army_number", "user__full_name"]


@admin.register(DirectingStaffProfile)
class DirectingStaffProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "course"]
    list_filter = ["course"]
    search_fields = ["user__army_number", "user__full_name"]
