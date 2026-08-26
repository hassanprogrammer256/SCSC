import os
from urllib.parse import urlparse

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, MIDDLEWARE

DEBUG = True

ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "").split(",") if host.strip()]

# WhiteNoise serves Django admin's own static assets directly from the app
# process — no separate static host/CDN needed. Must sit immediately after
# SecurityMiddleware per WhiteNoise's own setup docs. Only relevant to
# /admin/ — the React app's static assets are built/deployed separately
# (e.g. Netlify) and never touch this Django process.
MIDDLEWARE = [MIDDLEWARE[0], "whitenoise.middleware.WhiteNoiseMiddleware", *MIDDLEWARE[1:]]
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Parsed by hand (stdlib urllib only) rather than adding a dj-database-url
# dependency for one call site — see context/code-standards.md dependency list.
_db_url = urlparse(os.environ["DATABASE_URL"])
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": _db_url.path.lstrip("/"),
        "USER": _db_url.username,
        "PASSWORD": _db_url.password,
        "HOST": _db_url.hostname,
        "PORT": _db_url.port or 5432,
    }
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ["REDIS_URL"],
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

INSTALLED_APPS = [*INSTALLED_APPS, "cloudinary_storage", "cloudinary"]  # noqa: F405

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.environ.get("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": os.environ.get("CLOUDINARY_API_KEY"),
    "API_SECRET": os.environ.get("CLOUDINARY_API_SECRET"),
}
DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# ============== FIX FOR REDIRECT LOOP ==============
# Tell Django that it's behind a proxy that handles SSL
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# SSL Settings - must be paired with SECURE_PROXY_SSL_HEADER
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Additional security settings for Render
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'