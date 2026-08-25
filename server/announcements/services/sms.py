import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms(phone_number: str, message: str) -> bool:
    if not phone_number or not settings.EGOSMS_USERNAME:
        return False
    try:
        response = requests.get(
            "https://www.egosms.co/api/v1/plain/",
            params={
                "number": phone_number,
                "message": message,
                "username": settings.EGOSMS_USERNAME,
                "password": settings.EGOSMS_PASSWORD,
                "sender": "SENIOR COMMAND AND STAFF COLLEGE , JINJA-KIMAKA"
            },
            timeout=10,
        )
        return response.ok and "OK" in response.text
    except requests.RequestException:
        logger.exception("[announcements/sms] EgoSms delivery failed")
        return False
