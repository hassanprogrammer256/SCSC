from django.core.management.base import BaseCommand

from accounts.models import User

DEMO_PASSWORD = "Passw0rd!"

DEMO_USERS = [
    {"army_number": "UPDF-A1002", "role": User.Role.ADMIN, "rank": "Colonel", "full_name": "Grace Nakato", "country": "Uganda"},
    {"army_number": "UPDF-D2004", "role": User.Role.DIRECTING_STAFF, "rank": "Lt. Colonel", "full_name": "Peter Okello", "country": "Uganda"},
    {"army_number": "UPDF-O3006", "role": User.Role.OFFICER, "rank": "Major", "full_name": "Aisha Byaruhanga", "country": "Uganda"},
]


class Command(BaseCommand):
    help = "Creates (or resets) the 3 demo accounts used by the frontend login preview."

    def handle(self, *args, **options):
        for fields in DEMO_USERS:
            user, created = User.objects.update_or_create(
                army_number=fields["army_number"],
                defaults={**fields, "must_change_password": False, "is_active": True},
            )
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
            verb = "Created" if created else "Reset"
            self.stdout.write(self.style.SUCCESS(f"{verb}: {user.army_number} ({user.role})"))

        self.stdout.write(self.style.SUCCESS(f"Password for all demo accounts: {DEMO_PASSWORD}"))
