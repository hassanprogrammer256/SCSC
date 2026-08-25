from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from common.permissions import IsAdmin, IsNotArchived
from courses.models import Course
from scheduling.models import AssessmentSchedule, TimetableEntry
from scheduling.serializers import AssessmentScheduleSerializer, TimetableEntrySerializer


class TimetableEntryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = TimetableEntrySerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsNotArchived]

    def get_queryset(self):
        return TimetableEntry.objects.filter(activity__course_id=self.kwargs["course_pk"]).select_related(
            "activity", "land_group"
        )


class AssessmentScheduleViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AssessmentScheduleSerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsNotArchived]

    def get_permissions(self):
        # Officers need to read the deadline + instructions for their own
        # activities (Phase 5 submission screen); DS need it for marking.
        # Only writes (setting/editing the deadline) stay Admin-only.
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
        return AssessmentSchedule.objects.filter(activity__course_id=self.kwargs["course_pk"]).select_related("activity")
