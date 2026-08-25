from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from accounts.models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    ordering = ["army_number"]
    list_display = ["army_number", "full_name", "role", "rank", "country", "is_active", "must_change_password"]
    list_filter = ["role", "is_active", "must_change_password"]
    search_fields = ["army_number", "full_name"]
    fieldsets = (
        (None, {"fields": ("army_number", "password")}),
        ("Personal info", {"fields": ("full_name", "rank", "country", "phone_number", "email")}),
        ("Role", {"fields": ("role", "must_change_password")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "created_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("army_number", "role", "rank", "full_name", "country", "password1", "password2"),
            },
        ),
    )
    readonly_fields = ["created_at"]
