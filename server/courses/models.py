import uuid

from django.db import models


class Course(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=16, unique=True, help_text="e.g. 2026/27")
    start_year = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code


class LandGroup(models.Model):
    class Name(models.TextChoices):
        RED = "red", "Red Land"
        BLUE = "blue", "Blue Land"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="land_groups")
    name = models.CharField(max_length=8, choices=Name.choices)

    class Meta:
        unique_together = ("course", "name")

    def __str__(self):
        return f"{self.get_name_display()} — {self.course.code}"
