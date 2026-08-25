from rest_framework import serializers

from scheduling.models import AssessmentSchedule, TimetableEntry


class TimetableEntrySerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="activity.name", read_only=True)
    land_group_name = serializers.CharField(source="land_group.name", read_only=True)

    class Meta:
        model = TimetableEntry
        fields = ["id", "activity", "activity_name", "land_group", "land_group_name", "room", "start_at", "end_at"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        activity = attrs.get("activity", getattr(self.instance, "activity", None))
        land_group = attrs.get("land_group", getattr(self.instance, "land_group", None))
        room = attrs.get("room", getattr(self.instance, "room", None))
        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        end_at = attrs.get("end_at", getattr(self.instance, "end_at", None))

        if land_group.course_id != activity.course_id:
            raise serializers.ValidationError("Land Group must belong to the same course as the Activity.")
        if start_at >= end_at:
            raise serializers.ValidationError("End time must be after start time.")

        conflict = TimetableEntry.objects.filter(
            room=room, start_at__lt=end_at, end_at__gt=start_at
        ).exclude(pk=self.instance.pk if self.instance else None)
        if conflict.exists():
            raise serializers.ValidationError(f'Room "{room}" is already booked during that time window.')
        return attrs


class AssessmentScheduleSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="activity.name", read_only=True)

    class Meta:
        model = AssessmentSchedule
        fields = ["id", "activity", "activity_name", "instructions", "deadline"]
        read_only_fields = ["id"]

    def validate_activity(self, activity):
        course = self.context["course"]
        if activity.course_id != course.id:
            raise serializers.ValidationError("Activity must belong to this course.")
        return activity
