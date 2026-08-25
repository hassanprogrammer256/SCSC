import uuid

from django.conf import settings
from django.db import models

from activities.models import Activity
from courses.models import Course, LandGroup


class Announcement(models.Model):
    class Scope(models.TextChoices):
        ALL_OFFICERS = "all_officers", "All Officers"
        ALL_DS = "all_ds", "All Directing Staff"
        COURSE = "course", "Course"
        LAND_GROUP = "land_group", "Land Group"
        ACTIVITY = "activity", "Activity"
        INDIVIDUAL = "individual", "Individual"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_announcements")
    title = models.CharField(max_length=255)
    body = models.TextField()
    scope = models.CharField(max_length=16, choices=Scope.choices)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name="announcements")
    land_group = models.ForeignKey(LandGroup, on_delete=models.CASCADE, null=True, blank=True, related_name="announcements")
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, null=True, blank=True, related_name="announcements")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Notification(models.Model):
    class DeliveryStatus(models.TextChoices):
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        NOT_APPLICABLE = "not_applicable", "Not Applicable"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name="notifications")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    is_read = models.BooleanField(default=False)
    sms_status = models.CharField(max_length=16, choices=DeliveryStatus.choices, default=DeliveryStatus.NOT_APPLICABLE)
    email_status = models.CharField(max_length=16, choices=DeliveryStatus.choices, default=DeliveryStatus.NOT_APPLICABLE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.announcement.title} → {self.recipient}"
