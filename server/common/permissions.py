from rest_framework import permissions

from courses.models import Course


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsDirectingStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "directing_staff")


class IsOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "officer")


class IsNotArchived(permissions.BasePermission):
    """Rejects writes to course-scoped data once the course is archived — reads stay open.

    Covers both create (no object yet — resolved from the nested `course_pk`/
    `course_id` URL kwarg via drf-nested-routers) and update/delete (resolved
    from the object itself), so every course-scoped nested ViewSet is
    protected the same way without re-implementing this check per view.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        course_pk = view.kwargs.get("course_pk") or view.kwargs.get("course_id")
        if course_pk is None:
            return True
        course = Course.objects.filter(pk=course_pk).first()
        return course is None or course.status != "archived"

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        course = obj.course if hasattr(obj, "course") else obj
        return course.status != "archived"
