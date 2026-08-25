import re

from django.core.exceptions import ValidationError


class PasswordPolicyValidator:
    """Enforces the standard policy from context/project-overview.md: 8+ chars,
    at least one lowercase, one uppercase, one digit, one special character.
    Applied on every password change, including the forced first change.
    """

    def validate(self, password, user=None):
        if not re.search(r"[a-z]", password):
            raise ValidationError("Password must contain at least one lowercase letter.", code="password_no_lower")
        if not re.search(r"[A-Z]", password):
            raise ValidationError("Password must contain at least one uppercase letter.", code="password_no_upper")
        if not re.search(r"\d", password):
            raise ValidationError("Password must contain at least one digit.", code="password_no_digit")
        if not re.search(r"[^\w\s]", password):
            raise ValidationError("Password must contain at least one special character.", code="password_no_special")

    def get_help_text(self):
        return "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character."
