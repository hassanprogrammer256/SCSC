from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from assessments.services.grading import compute_officer_progress
from common.permissions import IsAdmin, IsNotArchived
from courses.models import Course, LandGroup
from courses.serializers import CourseSerializer, LandGroupSerializer
from personnel.models import OfficerProfile


class CourseViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """No destroy action — courses are never deleted, only archived (Phase 8's
    dedicated action, not this generic endpoint's `status` field).
    """

    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsAuthenticated(), IsAdmin(), IsNotArchived()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Course.objects.all().order_by("-start_year")
        if user.role == "admin":
            return queryset
        if user.role == "directing_staff":
            return queryset.filter(directing_staff__user=user).distinct()
        return queryset.filter(officers__user=user).distinct()

    @action(detail=True, methods=["get"], url_path="progress-report", permission_classes=[IsAuthenticated, IsAdmin])
    def progress_report(self, request, *args, **kwargs):
        """One request, every officer's progress — for the Admin Reports
        page (Progress/Completion). Avoids an N+1 of the per-officer
        `officers/{id}/progress/` action.
        """
        course = self.get_object()
        officers = OfficerProfile.objects.filter(course=course).select_related("user", "land_group")
        rows = []
        for officer in officers:
            result = compute_officer_progress(officer)
            outstanding = [a["activity_name"] for a in result["activities"] if not a["is_complete"]]
            rows.append(
                {
                    "officer_id": str(officer.id),
                    "army_number": officer.user.army_number,
                    "full_name": officer.user.full_name,
                    "land_group": officer.land_group.name,
                    "progress_percent": result["progress_percent"],
                    "weighted_average": result["weighted_average"],
                    "degree_class": result["degree_class"],
                    "outstanding_activities": outstanding,
                }
            )
        return Response(rows)

    @action(detail=True, methods=["post"], url_path="archive", permission_classes=[IsAuthenticated, IsAdmin])
    def archive(self, request, *args, **kwargs):
        """Only a completed course can be archived, and only once every
        officer has cleared every mandatory activity — see
        context/project-overview.md → Archive and build-plan.md feature 31.
        Archiving itself is what IsNotArchived then locks against further
        writes across every course-scoped endpoint.
        """
        course = self.get_object()
        if course.status == Course.Status.ARCHIVED:
            raise serializers.ValidationError("This course is already archived.")
        if course.status != Course.Status.COMPLETED:
            raise serializers.ValidationError("Only a completed course can be archived — mark it completed first.")

        officers = OfficerProfile.objects.filter(course=course)
        incomplete = [o for o in officers if compute_officer_progress(o)["degree_class"] is None]
        if incomplete:
            raise serializers.ValidationError(
                f"{len(incomplete)} officer(s) have not completed every mandatory activity yet."
            )

        course.status = Course.Status.ARCHIVED
        course.save(update_fields=["status"])
        return Response(CourseSerializer(course).data)


class LandGroupViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = LandGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LandGroup.objects.filter(course_id=self.kwargs["course_pk"])
