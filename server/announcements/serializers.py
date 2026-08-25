from rest_framework import serializers

from announcements.models import Announcement, Notification
from announcements.services.delivery import send_announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    recipient_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    recipient_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            "id",
            "sender",
            "sender_name",
            "title",
            "body",
            "scope",
            "course",
            "land_group",
            "activity",
            "recipient_ids",
            "recipient_count",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "created_at"]

    def get_recipient_count(self, obj):
        return obj.notifications.count()

    def validate(self, attrs):
        scope = attrs.get("scope")
        if scope == Announcement.Scope.COURSE and not attrs.get("course"):
            raise serializers.ValidationError("Course scope requires a course.")
        if scope == Announcement.Scope.LAND_GROUP and not attrs.get("land_group"):
            raise serializers.ValidationError("Land Group scope requires a land group.")
        if scope == Announcement.Scope.ACTIVITY and not attrs.get("activity"):
            raise serializers.ValidationError("Activity scope requires an activity.")
        if scope == Announcement.Scope.INDIVIDUAL and not attrs.get("recipient_ids"):
            raise serializers.ValidationError("Individual scope requires at least one recipient.")

        request = self.context["request"]
        if request.user.role == "directing_staff" and scope not in (
            Announcement.Scope.ACTIVITY,
            Announcement.Scope.INDIVIDUAL,
        ):
            raise serializers.ValidationError("Directing Staff may only target by Activity or individually.")
        return attrs

    def create(self, validated_data):
        recipient_ids = validated_data.pop("recipient_ids", None)
        request = self.context["request"]
        announcement = Announcement.objects.create(sender=request.user, **validated_data)
        send_announcement(announcement, [str(rid) for rid in recipient_ids] if recipient_ids else None)
        return announcement


class NotificationSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="announcement.title", read_only=True)
    body = serializers.CharField(source="announcement.body", read_only=True)
    sender_name = serializers.CharField(source="announcement.sender.full_name", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "announcement", "title", "body", "sender_name", "is_read", "sms_status", "email_status", "created_at"]
        read_only_fields = fields
