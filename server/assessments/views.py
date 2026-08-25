from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from activities.models import ActivityAssignment
from assessments.models import AssessmentReport, Mark, Submission
from assessments.serializers import (
    AdminSubmissionSerializer,
    AssessmentReportSerializer,
    DsSubmissionSerializer,
    MarkSerializer,
    OfficerSubmissionSerializer,
)
from assessments.services.plagiarism import run_plagiarism_check
from common.permissions import IsAdmin, IsDirectingStaff, IsNotArchived, IsOfficer
from courses.models import Course
from personnel.models import DirectingStaffProfile


def _ds_activity_land_group_filter(request_user, course_pk) -> Q | None:
    """Builds the Q restricting a query to only the (activity, land_group)
    pairs this Directing Staff is actually assigned to teach — a DS must
    never see submissions/marks for an activity/land-group they don't teach.
    Returns None if this user has no DS profile on this course (empty result).
    """
    ds_profile = DirectingStaffProfile.objects.filter(user=request_user, course_id=course_pk).first()
    if ds_profile is None:
        return None
    assignments = ActivityAssignment.objects.filter(directing_staff=ds_profile)
    q = Q()
    matched = False
    for assignment in assignments:
        q |= Q(assessment__activity_id=assignment.activity_id, officer__land_group_id=assignment.land_group_id)
        matched = True
    return q if matched else None


class SubmissionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """No update/destroy — a submission is immutable once made (Officers
    don't get to resubmit/withdraw in this pass; re-upload isn't in scope).
    """

    permission_classes = [IsAuthenticated, IsNotArchived]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsOfficer(), IsNotArchived()]
        if self.action == "check_plagiarism":
            return [IsAuthenticated(), IsDirectingStaff(), IsNotArchived()]
        return super().get_permissions()

    def get_course(self):
        return get_object_or_404(Course, pk=self.kwargs["course_pk"])

    def get_serializer_class(self):
        role = self.request.user.role
        if role == "officer":
            return OfficerSubmissionSerializer
        if role == "directing_staff":
            return DsSubmissionSerializer
        # Admin gets no plagiarism fields at all — DS-triggered, DS-only
        # visibility, by explicit product decision. See AdminSubmissionSerializer.
        return AdminSubmissionSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["course"] = self.get_course()
        return context

    def get_queryset(self):
        course_pk = self.kwargs["course_pk"]
        qs = Submission.objects.filter(assessment__activity__course_id=course_pk).select_related(
            "assessment__activity", "officer__user", "officer__land_group", "plagiarism_report"
        )
        user = self.request.user
        if user.role == "officer":
            return qs.filter(officer__user=user)
        if user.role == "directing_staff":
            ds_filter = _ds_activity_land_group_filter(user, course_pk)
            return qs.filter(ds_filter) if ds_filter is not None else qs.none()
        return qs

    @action(detail=True, methods=["post"], url_path="check-plagiarism")
    def check_plagiarism(self, request, *args, **kwargs):
        # get_object() already applies get_queryset()'s DS-scoping (own
        # assigned activity/land-group only) and IsNotArchived's
        # object-level check — a DS can't trigger this on a submission
        # outside their own roster.
        submission = self.get_object()
        run_plagiarism_check(submission)
        submission.refresh_from_db()
        serializer = DsSubmissionSerializer(submission, context=self.get_serializer_context())
        return Response(serializer.data)


class MarkViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = MarkSerializer
    permission_classes = [IsAuthenticated, IsNotArchived]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsAuthenticated(), IsDirectingStaff(), IsNotArchived()]
        return super().get_permissions()

    def get_course(self):
        return get_object_or_404(Course, pk=self.kwargs["course_pk"])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["course"] = self.get_course()
        return context

    def get_queryset(self):
        course_pk = self.kwargs["course_pk"]
        qs = Mark.objects.filter(assessment__activity__course_id=course_pk).select_related(
            "assessment__activity", "officer__user", "marked_by__user"
        )
        user = self.request.user
        if user.role == "officer":
            return qs.filter(officer__user=user)
        if user.role == "directing_staff":
            ds_filter = _ds_activity_land_group_filter(user, course_pk)
            return qs.filter(ds_filter) if ds_filter is not None else qs.none()
        return qs  # admin — read-only in practice since create/update require IsDirectingStaff


class AssessmentReportViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """A DS submits one report per assessment once marking is done; Admin
    reads the inbox. No update/destroy — a filed report is a fixed record,
    same immutability spirit as Submission.
    """

    serializer_class = AssessmentReportSerializer
    permission_classes = [IsAuthenticated, IsNotArchived]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsDirectingStaff(), IsNotArchived()]
        return [IsAuthenticated(), (IsAdmin | IsDirectingStaff)()]

    def get_course(self):
        return get_object_or_404(Course, pk=self.kwargs["course_pk"])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["course"] = self.get_course()
        return context

    def get_queryset(self):
        course_pk = self.kwargs["course_pk"]
        qs = AssessmentReport.objects.filter(assessment__activity__course_id=course_pk).select_related(
            "assessment__activity", "directing_staff__user"
        )
        user = self.request.user
        if user.role == "directing_staff":
            ds_profile = DirectingStaffProfile.objects.filter(user=user, course_id=course_pk).first()
            return qs.filter(directing_staff=ds_profile) if ds_profile else qs.none()
        return qs  # admin — full inbox
