from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserSerializer
from accounts.services.password import generate_initial_password
from personnel.models import DirectingStaffProfile, OfficerProfile


class _BaseRegistrationSerializer(serializers.ModelSerializer):
    """Shared lookup-or-create-by-army-number logic for Officer/DS
    registration. A returning army number reuses its User row (profile
    fields refreshed) but always gets a fresh one-time password — see
    context/architecture.md → Data Architecture Notes, decided during
    /architect for Phase 2.
    """

    role: str  # set by subclasses — accounts.User.Role value this form registers

    user = UserSerializer(read_only=True)
    initial_password = serializers.SerializerMethodField()

    army_number = serializers.CharField(write_only=True)
    rank = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    country = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    # Optional — Admin can set a photo at registration time; the officer/DS
    # can also change it later themselves via users/me/avatar/ (ProfilePage).
    avatar = serializers.ImageField(write_only=True, required=False, allow_null=True)

    def get_initial_password(self, obj):
        return getattr(obj, "_initial_password", None)

    def _resolve_user(self, validated_data, course, profile_model):
        army_number = validated_data.pop("army_number")
        avatar = validated_data.pop("avatar", None)
        user_fields = {
            "rank": validated_data.pop("rank"),
            "full_name": validated_data.pop("full_name"),
            "country": validated_data.pop("country"),
            "phone_number": validated_data.pop("phone_number", ""),
            "email": validated_data.pop("email", ""),
        }

        existing = User.objects.filter(army_number=army_number).first()
        if existing and existing.role != self.role:
            raise serializers.ValidationError(
                {"army_number": "This army number is already registered under a different role."}
            )
        if existing and profile_model.objects.filter(user=existing, course=course).exists():
            raise serializers.ValidationError({"army_number": "Already registered on this course."})

        plaintext_password = generate_initial_password()
        if existing:
            user = existing
            for field, value in user_fields.items():
                setattr(user, field, value)
        else:
            user = User(army_number=army_number, role=self.role, **user_fields)
        if avatar is not None:
            user.avatar = avatar
        user.set_password(plaintext_password)
        user.must_change_password = True
        user.save()
        return user, plaintext_password


class OfficerProfileSerializer(_BaseRegistrationSerializer):
    role = User.Role.OFFICER
    land_group_name = serializers.CharField(source="land_group.name", read_only=True)

    class Meta:
        model = OfficerProfile
        fields = [
            "id",
            "user",
            "land_group",
            "land_group_name",
            "initial_password",
            "army_number",
            "rank",
            "full_name",
            "country",
            "phone_number",
            "email",
            "avatar",
        ]
        read_only_fields = ["id"]

    def validate_land_group(self, land_group):
        course = self.context["course"]
        if land_group.course_id != course.id:
            raise serializers.ValidationError("Land Group must belong to this course.")
        return land_group

    def create(self, validated_data):
        course = self.context["course"]
        land_group = validated_data.pop("land_group")
        user, plaintext_password = self._resolve_user(validated_data, course, OfficerProfile)
        profile = OfficerProfile.objects.create(user=user, course=course, land_group=land_group)
        profile._initial_password = plaintext_password
        return profile


class DirectingStaffProfileSerializer(_BaseRegistrationSerializer):
    role = User.Role.DIRECTING_STAFF

    class Meta:
        model = DirectingStaffProfile
        fields = [
            "id",
            "user",
            "initial_password",
            "army_number",
            "rank",
            "full_name",
            "country",
            "phone_number",
            "email",
            "avatar",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        course = self.context["course"]
        user, plaintext_password = self._resolve_user(validated_data, course, DirectingStaffProfile)
        profile = DirectingStaffProfile.objects.create(user=user, course=course)
        profile._initial_password = plaintext_password
        return profile
