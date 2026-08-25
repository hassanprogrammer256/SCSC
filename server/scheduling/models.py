import uuid

from django.db import models

from activities.models import Activity
from courses.models import LandGroup


class TimetableEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="timetable_entries")
    land_group = models.ForeignKey(LandGroup, on_delete=models.CASCADE, related_name="timetable_entries")
    room = models.CharField(max_length=64)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()

    # No direct course FK — lets common.permissions.IsNotArchived resolve the
    # owning course on update/destroy, same fix as activities.ActivityAssignment.
    @property
    def course(self):
        return self.activity.course

    def __str__(self):
        return f"{self.activity.name} — {self.land_group.get_name_display()} — {self.room}"


class AssessmentSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.OneToOneField(Activity, on_delete=models.CASCADE, related_name="assessment_schedule")
    instructions = models.TextField(blank=True)
    deadline = models.DateTimeField()

    @property
    def course(self):
        return self.activity.course

    def __str__(self):
        return f"{self.activity.name} — due {self.deadline:%Y-%m-%d %H:%M}"
