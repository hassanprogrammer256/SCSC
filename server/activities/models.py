import uuid

from django.db import models

from courses.models import Course, LandGroup
from personnel.models import DirectingStaffProfile


class Activity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="activities")
    name = models.CharField(max_length=255)
    weight_percent = models.DecimalField(max_digits=5, decimal_places=2)
    is_mandatory = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.course.code})"


class ActivityAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="assignments")
    land_group = models.ForeignKey(LandGroup, on_delete=models.CASCADE, related_name="activity_assignments")
    directing_staff = models.ForeignKey(DirectingStaffProfile, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        # One DS per activity per land group. The application-level rule that
        # blocks the SAME directing_staff being assigned to the same activity
        # across BOTH land groups is enforced in the serializer, not here —
        # see context/architecture.md → activities.ActivityAssignment.
        unique_together = ("activity", "land_group")

    @property
    def course(self):
        # No direct course FK — this lets common.permissions.IsNotArchived's
        # has_object_permission (obj.course if hasattr(obj, "course") else obj)
        # resolve the owning course without special-casing this model.
        return self.activity.course

    def __str__(self):
        return f"{self.activity.name} / {self.land_group.get_name_display()} — {self.directing_staff}"
