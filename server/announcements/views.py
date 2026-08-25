from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from announcements.models import Announcement, Notification
from announcements.serializers import AnnouncementSerializer, NotificationSerializer
from common.permissions import IsAdmin, IsDirectingStaff


class AnnouncementViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """List = the sender's own Sent History; create fans out delivery
    synchronously (small recipient counts at this college's scale — same
    reasoning as the plagiarism check staying synchronous).
    """

    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), (IsAdmin | IsDirectingStaff)()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Announcement.objects.filter(sender=self.request.user).order_by("-created_at")


class NotificationViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """A user's own received notifications — the bell dropdown + full list
    page. The only mutation is toggling is_read.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related("announcement__sender").order_by("-created_at")

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if "is_read" in request.data:
            instance.is_read = bool(request.data["is_read"])
            instance.save(update_fields=["is_read"])
        return Response(self.get_serializer(instance).data)
