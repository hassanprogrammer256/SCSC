from rest_framework import serializers

from assessments.services.grading import compute_officer_progress
from courses.models import Course, LandGroup


class LandGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandGroup
        fields = ["id", "course", "name"]
        read_only_fields = fields


class CourseSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=[Course.Status.ACTIVE, Course.Status.COMPLETED],
        default=Course.Status.ACTIVE,
        help_text="Archiving is a separate, dedicated action (Phase 8) — not settable here.",
    )
    officer_count = serializers.SerializerMethodField()
    directing_staff_count = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    land_groups = LandGroupSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "start_year",
            "status",
            "created_at",
            "officer_count",
            "directing_staff_count",
            "progress_percent",
            "land_groups",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"start_year": {"required": False}}

    def get_officer_count(self, obj):
        return obj.officers.count()

    def get_directing_staff_count(self, obj):
        return obj.directing_staff.count()

    def get_progress_percent(self, obj):
        # Real average now that Phase 5's grading service exists — the
        # Phase 2 placeholder (always 0) is gone. Average of every officer's
        # own progress_percent (weight of their completed mandatory
        # activities), 0 for a course with no officers yet.
        officers = list(obj.officers.all())
        if not officers:
            return 0
        total = sum(compute_officer_progress(officer)["progress_percent"] for officer in officers)
        return round(total / len(officers))

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", Course.Status.ACTIVE))
        if status == Course.Status.ACTIVE:
            already_active = Course.objects.filter(status=Course.Status.ACTIVE)
            if self.instance is not None:
                already_active = already_active.exclude(pk=self.instance.pk)
            if already_active.exists():
                raise serializers.ValidationError(
                    "Only one course may be active at a time — mark the current course completed first."
                )
        return attrs

    def create(self, validated_data):
        if not validated_data.get("start_year"):
            validated_data["start_year"] = int(validated_data["code"].split("/")[0])
        course = Course.objects.create(**validated_data)
        LandGroup.objects.bulk_create(
            [
                LandGroup(course=course, name=LandGroup.Name.RED),
                LandGroup(course=course, name=LandGroup.Name.BLUE),
            ]
        )
        return course
