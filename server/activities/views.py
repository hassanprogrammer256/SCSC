from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from activities.models import Activity, ActivityAssignment
from activities.serializers import ActivityAssignmentSerializer, ActivitySerializer
from common.permissions import IsAdmin, IsDirectingStaff, IsNotArchived
from courses.models import Course
from personnel.models import DirectingStaffProfile


class ActivityViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsNotArchived]

    def get_permissions(self):
        # Reads are open to any course member — Officer/DS screens (Phase 5)
        # need Activity name/weight; only writes stay Admin-only.
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsNotArchived()]
        return super().get_permissions()

    def get_course(self):
        return get_object_or_404(Course, pk=self.kwargs["course_pk"])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["course"] = self.get_course()
        return context

    def get_queryset(self):
        return Activity.objects.filter(course_id=self.kwargs["course_pk"]).order_by("id")


class ActivityAssignmentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ActivityAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsNotArchived]

    def get_permissions(self):
        # A DS needs to discover their own assignments (which Activity/Land
        # Group they teach) for the Phase 5 marking screens — scoped to only
        # their own rows in get_queryset() below, never the full board.
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), (IsAdmin | IsDirectingStaff)(), IsNotArchived()]
        return super().get_permissions()

    def get_queryset(self):
        qs = ActivityAssignment.objects.filter(
            activity__course_id=self.kwargs["course_pk"]
        ).select_related("activity", "land_group", "directing_staff__user")
        user = self.request.user
        if user.role == "directing_staff":
            ds_profile = DirectingStaffProfile.objects.filter(user=user, course_id=self.kwargs["course_pk"]).first()
            return qs.filter(directing_staff=ds_profile) if ds_profile else qs.none()
        return qs
