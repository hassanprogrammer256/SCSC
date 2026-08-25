from django.db.models import Q

from accounts.models import User
from activities.models import ActivityAssignment
from announcements.models import Announcement, Notification
from announcements.services.email import send_announcement_email
from announcements.services.sms import send_sms


def resolve_recipients(announcement: Announcement, recipient_ids: list[str] | None = None) -> "list[User]":
    """Resolves the target User queryset for an Announcement's scope. Never
    trusts the client for anything except the individual-recipient id list
    (scope=individual) — every other scope is resolved from the
    Announcement's own FK fields, set server-side by the serializer.
    """
    scope = announcement.scope
    if scope == Announcement.Scope.ALL_OFFICERS:
        return list(User.objects.filter(role="officer", is_active=True))
    if scope == Announcement.Scope.ALL_DS:
        return list(User.objects.filter(role="directing_staff", is_active=True))
    if scope == Announcement.Scope.COURSE:
        return list(
            User.objects.filter(is_active=True)
            .filter(Q(officer_profiles__course_id=announcement.course_id) | Q(directing_staff_profiles__course_id=announcement.course_id))
            .distinct()
        )
    if scope == Announcement.Scope.LAND_GROUP:
        return list(
            User.objects.filter(is_active=True, officer_profiles__land_group_id=announcement.land_group_id).distinct()
        )
    if scope == Announcement.Scope.ACTIVITY:
        land_group_ids = ActivityAssignment.objects.filter(activity_id=announcement.activity_id).values_list(
            "land_group_id", flat=True
        )
        return list(
            User.objects.filter(is_active=True, officer_profiles__land_group_id__in=land_group_ids).distinct()
        )
    if scope == Announcement.Scope.INDIVIDUAL:
        return list(User.objects.filter(id__in=recipient_ids or [], is_active=True))
    return []


def send_announcement(announcement: Announcement, recipient_ids: list[str] | None = None) -> list[Notification]:
    """Fan-out: for every resolved recipient, create the in-app Notification
    row and independently attempt SMS + email — one channel's failure never
    blocks another, and every recipient still gets their in-app notification
    even if both external channels fail. See context/architecture.md's
    Announcement Delivery data flow.
    """
    recipients = resolve_recipients(announcement, recipient_ids)
    notifications = []
    for recipient in recipients:
        sms_ok = send_sms(recipient.phone_number, f"{announcement.title}: {announcement.body}")
        email_ok = send_announcement_email(recipient.email, announcement.title, announcement.body)
        notifications.append(
            Notification.objects.create(
                announcement=announcement,
                recipient=recipient,
                sms_status=Notification.DeliveryStatus.SENT
                if sms_ok
                else (Notification.DeliveryStatus.NOT_APPLICABLE if not recipient.phone_number else Notification.DeliveryStatus.FAILED),
                email_status=Notification.DeliveryStatus.SENT
                if email_ok
                else (Notification.DeliveryStatus.NOT_APPLICABLE if not recipient.email else Notification.DeliveryStatus.FAILED),
            )
        )
    return notifications
