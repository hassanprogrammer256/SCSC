import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


def avatar_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"profiles/{instance.id}.{ext}"


class UserManager(BaseUserManager):
    def create_user(self, army_number, password=None, **extra_fields):
        if not army_number:
            raise ValueError("Army number is required")
        user = self.model(army_number=army_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, army_number, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("rank", "Colonel")
        extra_fields.setdefault("full_name", army_number)
        extra_fields.setdefault("country", "Uganda")
        extra_fields.setdefault("must_change_password", False)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(army_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        DIRECTING_STAFF = "directing_staff", "Directing Staff"
        OFFICER = "officer", "Officer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    army_number = models.CharField(max_length=32, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    rank = models.CharField(max_length=64)
    full_name = models.CharField(max_length=255)
    country = models.CharField(max_length=64)
    phone_number = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    # Local MEDIA_ROOT (dev) / Cloudinary (prod) — same environment-switched
    # storage backend as everything else in DEFAULT_FILE_STORAGE, per
    # context/architecture.md's Media Storage table. Plain ImageField (not a
    # CloudinaryField) so dev needs zero extra config — unlike Submission's
    # file_url, avatars are genuinely images, so Cloudinary's default
    # "image" resource type is already correct, no "raw" override needed.
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    must_change_password = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "army_number"
    REQUIRED_FIELDS = ["full_name", "role", "rank", "country"]

    def __str__(self):
        return f"{self.army_number} ({self.get_role_display()})"


class UserActionLog(models.Model):
    """Actor/target/timestamp trail for Admin user-management actions
    (password reset, deactivate/reactivate) — build-plan.md Phase 8 feature
    32 explicitly calls for this; unlike a general system-wide audit log
    (out of scope, see progress-tracker.md), this is scoped to just these
    two actions since that's all the feature describes.
    """

    class Action(models.TextChoices):
        PASSWORD_RESET = "password_reset", "Password Reset"
        DEACTIVATED = "deactivated", "Deactivated"
        REACTIVATED = "reactivated", "Reactivated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="actions_taken")
    target = models.ForeignKey(User, on_delete=models.CASCADE, related_name="actions_received")
    action = models.CharField(max_length=20, choices=Action.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor} {self.action} {self.target}"
