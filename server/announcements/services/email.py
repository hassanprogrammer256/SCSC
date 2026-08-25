import logging
import smtplib

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_announcement_email(to_email: str, subject: str, body: str) -> bool:
    if not to_email or not settings.EMAIL_HOST_USER:
        return False
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
        return True
    except (smtplib.SMTPException, OSError):
        logger.exception("[announcements/email] Gmail SMTP delivery failed")
        return False
