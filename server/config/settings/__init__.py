import os

# DJANGO_ENV selects which settings module (and which .env file, loaded from
# within that module) is active — see context/architecture.md → Environment
# Configuration. Defaults to development so `manage.py runserver` works with
# zero setup.
_env = os.environ.get("DJANGO_ENV", "development")

if _env == "production":
    from .production import *  # noqa: F401,F403
else:
    from .development import *  # noqa: F401,F403
