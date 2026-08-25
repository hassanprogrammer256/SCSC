from django.db.models import Sum
from rest_framework import serializers

from activities.models import Activity, ActivityAssignment


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ["id", "course", "name", "weight_percent", "is_mandatory"]
        read_only_fields = ["id", "course", "is_mandatory"]

    def validate_weight_percent(self, value):
        if value <= 0:
            raise serializers.ValidationError("Weight must be greater than 0%.")
        return value

    def validate(self, attrs):
        course = self.context["course"]
        weight = attrs.get("weight_percent", getattr(self.instance, "weight_percent", None))
        total = Activity.objects.filter(course=course).exclude(
            pk=self.instance.pk if self.instance else None
        ).aggregate(total=Sum("weight_percent"))["total"] or 0
        if total + weight > 100:
            remaining = 100 - total
            raise serializers.ValidationError(
                f"Activity weights cannot exceed 100% for this course — {remaining}% remaining."
            )
        return attrs

    def create(self, validated_data):
        return Activity.objects.create(course=self.context["course"], **validated_data)


class ActivityAssignmentSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="activity.name", read_only=True)
    land_group_name = serializers.CharField(source="land_group.name", read_only=True)
    directing_staff_name = serializers.CharField(source="directing_staff.user.full_name", read_only=True)

    class Meta:
        model = ActivityAssignment
        fields = [
            "id",
            "activity",
            "activity_name",
            "land_group",
            "land_group_name",
            "directing_staff",
            "directing_staff_name",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        activity = attrs.get("activity", getattr(self.instance, "activity", None))
        land_group = attrs.get("land_group", getattr(self.instance, "land_group", None))
        directing_staff = attrs.get("directing_staff", getattr(self.instance, "directing_staff", None))

        if land_group.course_id != activity.course_id:
            raise serializers.ValidationError("Land Group must belong to the same course as the Activity.")
        if directing_staff.course_id != activity.course_id:
            raise serializers.ValidationError("Directing Staff must belong to the same course as the Activity.")

        conflict = ActivityAssignment.objects.filter(
            activity=activity, directing_staff=directing_staff
        ).exclude(land_group=land_group).exclude(pk=self.instance.pk if self.instance else None)
        if conflict.exists():
            raise serializers.ValidationError(
                "This Directing Staff already teaches this Activity to the other Land Group."
            )
        return attrs
