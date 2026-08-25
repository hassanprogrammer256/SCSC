from django.conf import settings
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.models import User, UserActionLog
from accounts.serializers import ArmyNumberTokenObtainPairSerializer, UserSerializer
from accounts.services.password import generate_initial_password
from common.permissions import IsAdmin


def _set_refresh_cookie(response, refresh_token: str) -> None:
    response.set_cookie(
        settings.REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path=settings.REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite="Lax",
    )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — the refresh token never reaches the response
    body, only an httpOnly cookie (context/architecture.md → Authentication).
    """

    serializer_class = ArmyNumberTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        refresh_token = data.pop("refresh")

        response = Response({"access": data["access"], "user": data["user"]}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, refresh_token)
        return response


class RefreshView(APIView):
    """POST /api/auth/refresh/ — reads the httpOnly cookie, never the body.

    Also returns the user object (not just SimpleJWT's default {"access"})
    so the frontend can bootstrap a full session (accessToken + user) from
    just the cookie on app load — access tokens live in Redux memory only
    (never localStorage, per context/architecture.md), so a hard page
    reload/reopen has nothing else to rebuild the session from.
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        raw_refresh = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not raw_refresh:
            return Response({"detail": "No refresh token."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(raw_refresh)
            access = str(refresh.access_token)
            user = User.objects.get(pk=refresh.payload["user_id"])
        except (TokenError, User.DoesNotExist):
            return Response({"detail": "Refresh token invalid or expired."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({"access": access, "user": UserSerializer(user).data}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/auth/logout/ — clears the refresh cookie."""

    def post(self, request, *args, **kwargs):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(settings.REFRESH_COOKIE_NAME, path=settings.REFRESH_COOKIE_PATH)
        return response


class UserViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Admin-only user list + account-management actions (Phase 8 feature
    32) — reset a one-time password, deactivate/reactivate. Every action
    writes a UserActionLog row (actor, target, timestamp).
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all().order_by("-created_at")

    def get_permissions(self):
        # "me" and its sub-actions are the one exception — every other
        # action here manages *other* users' accounts and stays Admin-only.
        if self.action in ("me", "update_avatar", "change_password"):
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="me/avatar")
    def update_avatar(self, request, *args, **kwargs):
        # No explicit parser_classes needed — MultiPartParser is one of
        # DRF's own defaults, same as Submission's file upload (Phase 5).
        avatar = request.FILES.get("avatar")
        if not avatar:
            return Response({"detail": "No avatar file provided."}, status=status.HTTP_400_BAD_REQUEST)
        request.user.avatar = avatar
        request.user.save(update_fields=["avatar"])
        return Response(UserSerializer(request.user, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="me/change-password")
    def change_password(self, request, *args, **kwargs):
        current_password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")
        if not request.user.check_password(current_password):
            return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            password_validation.validate_password(new_password, user=request.user)
        except DjangoValidationError as exc:
            return Response({"detail": " ".join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.must_change_password = False
        request.user.save()
        return Response({"detail": "Password changed."})

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, *args, **kwargs):
        user = self.get_object()
        plaintext_password = generate_initial_password()
        user.set_password(plaintext_password)
        user.must_change_password = True
        user.save()
        UserActionLog.objects.create(actor=request.user, target=user, action=UserActionLog.Action.PASSWORD_RESET)
        return Response({"initial_password": plaintext_password})

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        UserActionLog.objects.create(actor=request.user, target=user, action=UserActionLog.Action.DEACTIVATED)
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="reactivate")
    def reactivate(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        UserActionLog.objects.create(actor=request.user, target=user, action=UserActionLog.Action.REACTIVATED)
        return Response(UserSerializer(user).data)
