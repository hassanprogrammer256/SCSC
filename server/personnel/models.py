import uuid

from django.conf import settings
from django.db import models

from courses.models import Course, LandGroup


class OfficerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # ForeignKey, not OneToOneField — a returning officer gets a new profile
    # per course (fresh password each time too), with prior-course profiles
    # kept as immutable history once that course is archived. See
    # context/architecture.md → Data Architecture Notes.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="officer_profiles")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="officers")
    land_group = models.ForeignKey(LandGroup, on_delete=models.PROTECT, related_name="officers")

    class Meta:
        unique_together = ("user", "course")

    def __str__(self):
        return f"{self.user.army_number} — {self.course.code}"


class DirectingStaffProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="directing_staff_profiles")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="directing_staff")

    class Meta:
        unique_together = ("user", "course")

    def __str__(self):
        return f"{self.user.army_number} — {self.course.code}"
