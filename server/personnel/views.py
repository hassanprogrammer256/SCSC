from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from activities.models import ActivityAssignment
from assessments.services.grading import compute_officer_progress
from common.permissions import IsAdmin, IsDirectingStaff, IsNotArchived
from courses.models import Course
from personnel.models import DirectingStaffProfile, OfficerProfile
from personnel.serializers import DirectingStaffProfileSerializer, OfficerProfileSerializer


class _CourseScopedRegistrationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Shared shape for the Officer/DS registration ViewSets — registration
    only creates/lists; edits to an existing profile (Land Group re-assign,
    deactivation) belong to later phases (User Management, Assignments).
    """

    permission_classes = [IsAuthenticated, IsAdmin, IsNotArchived]

    def get_course(self):
        return get_object_or_404(Course, pk=self.kwargs["course_pk"])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["course"] = self.get_course()
        return context

    # list/retrieve/create stay Admin-only (registration + rosters) — "me"
    # is the one exception, open to any authenticated user, since an
    # Officer/DS otherwise has no way to discover their own profile id on
    # this course (needed for Phase 5's submission/marking/progress screens)
    # without being handed the whole course roster.
    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request, *args, **kwargs):
        profile = self.get_queryset().filter(user=request.user).first()
        if profile is None:
            raise NotFound("No profile for this user on this course.")
        return Response(self.get_serializer(profile).data)


class OfficerViewSet(_CourseScopedRegistrationViewSet):
    serializer_class = OfficerProfileSerializer

    def get_permissions(self):
        # A DS needs the officer roster to build their marking screens —
        # scoped in get_queryset() below to only the Land Groups they
        # actually teach, never the whole course roster.
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), (IsAdmin | IsDirectingStaff)(), IsNotArchived()]
        return super().get_permissions()

    def get_queryset(self):
        qs = OfficerProfile.objects.filter(course_id=self.kwargs["course_pk"]).select_related("user", "land_group")
        user = self.request.user
        if user.role == "directing_staff":
            ds_profile = DirectingStaffProfile.objects.filter(user=user, course_id=self.kwargs["course_pk"]).first()
            land_group_ids = ActivityAssignment.objects.filter(directing_staff=ds_profile).values_list(
                "land_group_id", flat=True
            )
            return qs.filter(land_group_id__in=land_group_ids) if ds_profile else qs.none()
        return qs

    @action(detail=True, methods=["get"], url_path="progress", permission_classes=[IsAuthenticated])
    def progress(self, request, *args, **kwargs):
        officer = self.get_object()
        if request.user.role != "admin" and officer.user_id != request.user.id:
            raise PermissionDenied("You may only view your own progress.")
        return Response(compute_officer_progress(officer))


class DirectingStaffViewSet(_CourseScopedRegistrationViewSet):
    serializer_class = DirectingStaffProfileSerializer

    def get_queryset(self):
        return DirectingStaffProfile.objects.filter(course_id=self.kwargs["course_pk"]).select_related("user")
