from django.contrib import admin

from announcements.models import Announcement, Notification


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "sender", "scope", "created_at"]
    list_filter = ["scope"]
    search_fields = ["title"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["announcement", "recipient", "is_read", "sms_status", "email_status", "created_at"]
    list_filter = ["is_read", "sms_status", "email_status"]
