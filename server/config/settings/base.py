import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# DJANGO_ENV picks which .env file loads — see context/architecture.md →
# Environment Configuration. The leaf settings module (development.py /
# production.py) is selected by config/settings/__init__.py using the same
# variable, so the two always stay in sync.
DJANGO_ENV = os.environ.get("DJANGO_ENV", "development")
load_dotenv(BASE_DIR / f".env.{DJANGO_ENV}")

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-secret-key")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_nested",
    "corsheaders",
    "accounts",
    "courses",
    "personnel",
    "activities",
    "scheduling",
    "assessments",
    "announcements",
    "common",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    {"NAME": "accounts.validators.PasswordPolicyValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Kampala"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# The refresh token travels only as an httpOnly cookie, never in a JSON body
# the frontend could read from JS — see accounts/views.py and
# context/architecture.md → Authentication.
REFRESH_COOKIE_NAME = "scsc_refresh_token"
REFRESH_COOKIE_PATH = "/api/auth/"

# Announcement delivery — SMS (EgoSms) + email (Gmail SMTP) channels, see
# context/library-docs.md. Both fail closed (empty credentials → the
# service functions catch the resulting request/SMTP error and record
# sms_status/email_status = "failed" on the Notification row) rather than
# raising — an announcement always sends its in-app notification regardless
# of whether these external channels are configured.
EGOSMS_USERNAME = os.environ.get("EGOSMS_USERNAME", "")
EGOSMS_PASSWORD = os.environ.get("EGOSMS_PASSWORD", "")
EGOSMS_SENDER_ID = os.environ.get("EGOSMS_SENDER_ID", "")

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")  # Gmail App Password, never the account password
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Plagiarism external-source checking (assessments/services/web_search.py) —
# Google Programmable Search JSON API. Same fail-closed pattern as
# EgoSms/Gmail above: blank credentials just mean external_checked=False on
# every report, internal (cohort) comparison is unaffected. The free tier
# caps at 100 queries/day project-wide — raise PLAGIARISM_EXTERNAL_DAILY_QUOTA
# once a paid key is in place, no code change needed.
GOOGLE_SEARCH_API_KEY = os.environ.get("GOOGLE_SEARCH_API_KEY", "")
GOOGLE_SEARCH_CSE_ID = os.environ.get("GOOGLE_SEARCH_CSE_ID", "")
PLAGIARISM_EXTERNAL_DAILY_QUOTA = int(os.environ.get("PLAGIARISM_EXTERNAL_DAILY_QUOTA", "100"))
