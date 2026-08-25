from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "army_number",
            "role",
            "rank",
            "full_name",
            "country",
            "phone_number",
            "email",
            "avatar_url",
            "must_change_password",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "army_number", "role", "created_at"]

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url


class ArmyNumberTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "army_number"

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
