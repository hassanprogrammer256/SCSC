from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("config.api_router")),
]

# Dev-only: serves local MEDIA_ROOT (submissions, avatars) at MEDIA_URL —
# prod uses Cloudinary instead (see context/architecture.md → Media Storage),
# which doesn't need Django to serve anything itself.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
