from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import serializers

from assessments.models import AssessmentReport, Mark, Submission
from assessments.services.grading import grade_for_score
from common.validators import validate_submission_file
from personnel.models import DirectingStaffProfile, OfficerProfile


class _BaseSubmissionSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="assessment.activity.name", read_only=True)
    officer_name = serializers.CharField(source="officer.user.full_name", read_only=True)
    army_number = serializers.CharField(source="officer.user.army_number", read_only=True)
    land_group = serializers.CharField(source="officer.land_group.name", read_only=True)
    file = serializers.FileField(write_only=True)
    # Absolute, downloadable URL for the stored file — resolved via
    # default_storage.url() so it works for both local MEDIA_ROOT (dev) and
    # Cloudinary (prod) without branching. Not sensitive (it's the officer's
    # own uploaded work), so shared by every role's serializer, unlike the
    # plagiarism fields which are DS-only.
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "assessment",
            "activity_name",
            "officer",
            "officer_name",
            "army_number",
            "land_group",
            "file",
            "file_url",
            "file_type",
            "submitted_at",
            "is_late",
        ]
        read_only_fields = ["id", "officer", "file_type", "submitted_at", "is_late"]

    def get_file_url(self, obj):
        if not obj.file_url:
            return None
        request = self.context.get("request")
        url = default_storage.url(obj.file_url)
        return request.build_absolute_uri(url) if request else url

    def validate(self, attrs):
        assessment = attrs.get("assessment")
        if assessment.deadline < timezone.now():
            raise serializers.ValidationError("The submission deadline for this activity has passed.")
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        course = self.context["course"]
        officer = OfficerProfile.objects.get(user=request.user, course=course)
        uploaded_file = validated_data.pop("file")
        file_type = validate_submission_file(uploaded_file)

        assessment = validated_data["assessment"]
        storage_path = f"submissions/{course.code.replace('/', '-')}/{officer.id}/{assessment.id}.{file_type}"
        saved_name = default_storage.save(storage_path, uploaded_file)

        submission = Submission.objects.create(
            assessment=assessment,
            officer=officer,
            file_url=saved_name,
            file_type=file_type,
            is_late=False,
        )
        # No automatic plagiarism check here — it's DS-triggered only, via
        # SubmissionViewSet.check_plagiarism. See
        # assessments/services/plagiarism.py.
        return submission


class OfficerSubmissionSerializer(_BaseSubmissionSerializer):
    """Never includes plagiarism fields — reachable by Officer-role requests
    only. See context/code-standards.md → Plagiarism Service: enforced by a
    dedicated serializer, never a shared one with conditional visibility.
    """


class AdminSubmissionSerializer(_BaseSubmissionSerializer):
    """Also never includes plagiarism fields — Admin has no visibility into
    plagiarism results at all, only DS does (DS-triggered, DS-only per
    explicit product decision). Kept as its own dedicated serializer rather
    than reusing OfficerSubmissionSerializer, both for clarity and because
    that class's own docstring claims Officer-only reachability.
    """


class DsSubmissionSerializer(_BaseSubmissionSerializer):
    plagiarism_status = serializers.CharField(source="plagiarism_report.status", read_only=True, default=None)
    plagiarism_score = serializers.FloatField(source="plagiarism_report.score", read_only=True, default=None)
    plagiarism_highlights = serializers.JSONField(source="plagiarism_report.highlights", read_only=True, default=list)
    plagiarism_external_checked = serializers.BooleanField(
        source="plagiarism_report.external_checked", read_only=True, default=False
    )
    plagiarism_checked_at = serializers.DateTimeField(source="plagiarism_report.checked_at", read_only=True, default=None)

    class Meta(_BaseSubmissionSerializer.Meta):
        fields = _BaseSubmissionSerializer.Meta.fields + [
            "plagiarism_status",
            "plagiarism_score",
            "plagiarism_highlights",
            "plagiarism_external_checked",
            "plagiarism_checked_at",
        ]


class MarkSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="assessment.activity.name", read_only=True)
    officer_name = serializers.CharField(source="officer.user.full_name", read_only=True)
    army_number = serializers.CharField(source="officer.user.army_number", read_only=True)
    grade = serializers.SerializerMethodField()

    class Meta:
        model = Mark
        fields = [
            "id",
            "assessment",
            "activity_name",
            "officer",
            "officer_name",
            "army_number",
            "score",
            "remarks",
            "comments",
            "is_complete",
            "marked_by",
            "marked_at",
            "grade",
        ]
        read_only_fields = ["id", "marked_by", "marked_at"]

    def get_grade(self, obj):
        return grade_for_score(obj.score)

    def create(self, validated_data):
        request = self.context["request"]
        course = self.context["course"]
        validated_data["marked_by"] = DirectingStaffProfile.objects.filter(user=request.user, course=course).first()
        return Mark.objects.create(**validated_data)


class AssessmentReportSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="assessment.activity.name", read_only=True)
    directing_staff_name = serializers.CharField(source="directing_staff.user.full_name", read_only=True)

    class Meta:
        model = AssessmentReport
        fields = ["id", "assessment", "activity_name", "directing_staff", "directing_staff_name", "body", "submitted_at"]
        read_only_fields = ["id", "directing_staff", "submitted_at"]

    def create(self, validated_data):
        request = self.context["request"]
        course = self.context["course"]
        validated_data["directing_staff"] = DirectingStaffProfile.objects.get(user=request.user, course=course)
        return AssessmentReport.objects.create(**validated_data)
