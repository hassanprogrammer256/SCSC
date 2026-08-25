from rest_framework_nested import routers

from accounts.views import UserViewSet
from activities.views import ActivityAssignmentViewSet, ActivityViewSet
from announcements.views import AnnouncementViewSet, NotificationViewSet
from assessments.views import AssessmentReportViewSet, MarkViewSet, SubmissionViewSet
from courses.views import CourseViewSet, LandGroupViewSet
from personnel.views import DirectingStaffViewSet, OfficerViewSet
from scheduling.views import AssessmentScheduleViewSet, TimetableEntryViewSet

router = routers.DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
router.register("announcements", AnnouncementViewSet, basename="announcement")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("users", UserViewSet, basename="user")

courses_router = routers.NestedDefaultRouter(router, "courses", lookup="course")
courses_router.register("land-groups", LandGroupViewSet, basename="course-land-groups")
courses_router.register("officers", OfficerViewSet, basename="course-officers")
courses_router.register("directing-staff", DirectingStaffViewSet, basename="course-directing-staff")
courses_router.register("activities", ActivityViewSet, basename="course-activities")
courses_router.register("assignments", ActivityAssignmentViewSet, basename="course-assignments")
courses_router.register("timetable", TimetableEntryViewSet, basename="course-timetable")
courses_router.register("assessments", AssessmentScheduleViewSet, basename="course-assessments")
courses_router.register("submissions", SubmissionViewSet, basename="course-submissions")
courses_router.register("marks", MarkViewSet, basename="course-marks")
courses_router.register("reports", AssessmentReportViewSet, basename="course-reports")

urlpatterns = router.urls + courses_router.urls
