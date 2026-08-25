# Library Docs

Project-specific usage patterns for every third-party library in SCSC ERP. This file only covers how we use each library in *this* project — rules, patterns, and constraints specific to the college's domain rules. General API documentation still applies; this file only overrides it where our usage is specific.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

1. **Check AGENTS.md / installed skills** for any package-specific skill or MCP server available in this environment — use it before general training knowledge for fast-moving libraries (Joy UI in particular has shipped breaking changes across versions).
2. **Read this file** for project-specific rules.
3. Fall back to general knowledge only when neither of the above covers the case.

---

## Redux Toolkit + React-Redux

### Store Setup

```typescript
// src/app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import coursesReducer from "@/features/courses/coursesSlice";
import activitiesReducer from "@/features/activities/activitiesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    activities: activitiesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks

```typescript
// src/app/hooks.ts
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

**Rules:**

- Always use `useAppDispatch`/`useAppSelector`, never the untyped `react-redux` hooks directly.
- `auth.accessToken` lives in Redux memory only — never persisted to `localStorage` (XSS risk given the sensitivity of army-officer data). The refresh token is an httpOnly cookie set by the Django backend.
- On login, dispatch `setSession({ user, accessToken })`. On logout, dispatch `clearSession()` and call the backend logout endpoint to invalidate the refresh cookie.

---

## MUI Joy UI (`@mui/joy`)

### Provider Setup

```tsx
// src/main.tsx
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { joyTheme } from "@/theme/joyTheme";

<CssVarsProvider theme={joyTheme} defaultMode="light">
  <CssBaseline />
  <App />
</CssVarsProvider>;
```

**Rules:**

- Joy UI is a **separate component system from MUI Material** — never import from `@mui/material`. Only `@mui/joy` components are used.
- All Joy components consume the theme built in `theme/joyTheme.ts` — never pass ad hoc `sx={{ color: "#..." }}` hex values; reference theme tokens (`sx={{ color: "var(--joy-palette-warning-500)" }}` or the semantic `color`/`variant` props).
- Prefer Joy's built-in `color` prop (`primary` / `success` / `warning` / `danger` / `neutral`) over manual `sx` overrides wherever the semantic mapping in `ui-tokens.md` covers the case.
- Joy `Chip`, `Sheet`, `Card`, `Table`, `Tabs`, `Modal`, `CircularProgress` are the primary building blocks for dashboards, rosters, and marking screens — don't hand-roll equivalents with plain `div`s.

### Role Palette + Theme Mode (dual-axis theming)

The theme object in `joyTheme.ts` never hardcodes a color — every palette value is a CSS variable reference (`var(--color-primary)`, etc.). The actual colors come from `data-role` and `data-theme` attributes set once on `<html>` by `AppShell` from session state (role) and a small local preference (mode). This means:

- Switching light/dark mode is a `data-theme` attribute flip — Joy's `colorSchemes.light`/`.dark` still exist and are still what CssVarsProvider toggles, but both point at the same CSS variables, so the variables (not Joy) carry the actual mode-specific hex values.
- Switching role is never done through Joy's mode API at all — it's a separate `data-role` attribute this project adds on top of Joy's own light/dark mechanism.
- Never call `useColorScheme()` to try to switch roles — that hook only ever knows about `light`/`dark`. Role comes from `useAppSelector((s) => s.auth.user.role)`, not from Joy.

See `ui-tokens.md` for the full token matrix.

### Tailwind + Joy Coexistence

- Tailwind handles **layout** (flex/grid, spacing, max-width, responsive breakpoints).
- Joy handles **components** (anything interactive or with built-in state: buttons, inputs, selects, chips, modals, tabs).
- Never use Tailwind's color utilities on a Joy component's internals — style Joy components only through its theme or `color`/`variant` props.
- It's expected and correct to see `<Box className="flex gap-4">` — Tailwind classes on Joy's layout primitives (`Box`, `Stack`) are fine since those are unstyled layout wrappers, not themed components.

---

## react-router-dom (v6)

### Role-Guarded Routes

```tsx
// src/app/router.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/change-password" element={<ChangePasswordPage />} />
  <Route element={<RequireAuth />}>
    <Route element={<RequireRole role="admin" />}>
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Route>
    <Route element={<RequireRole role="directing_staff" />}>
      <Route path="/ds/*" element={<DsRoutes />} />
    </Route>
    <Route element={<RequireRole role="officer" />}>
      <Route path="/officer/*" element={<OfficerRoutes />} />
    </Route>
  </Route>
</Routes>
```

**Rules:**

- `RequireAuth` redirects to `/login` if no session; additionally redirects to `/change-password` if `must_change_password` is true, before rendering any nested route.
- `RequireRole` redirects to the user's own dashboard if their role doesn't match the branch — never renders a blank page or throws on mismatch.
- Route params for course-scoped pages always include `courseId` explicitly in the path (e.g. `/admin/courses/:courseId/activities`) rather than relying on a global "current course" assumption, so deep links and the Archive's read-only views work identically.

---

## axios

### Client Setup with JWT Refresh

```typescript
// src/lib/apiClient.ts
import axios from "axios";
import { store } from "@/app/store";
import { setSession, clearSession } from "@/features/auth/authSlice";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh/`,
        {},
        { withCredentials: true },
      );
      store.dispatch(setSession({ accessToken: data.access, user: data.user }));
      error.config.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(error.config);
    }
    if (error.response?.status === 401) store.dispatch(clearSession());
    return Promise.reject(error);
  },
);
```

**Rules:**

- Always `withCredentials: true` so the refresh cookie travels with every request.
- Retry a failed request **once** on 401, never loop.
- File uploads (submissions, resources) use `multipart/form-data` with a `FormData` body — never JSON-encode a file.

---

## react-toastify

```typescript
import { toast } from "react-toastify";

toast.success("Officer registered — initial password sent by SMS and email.");
toast.error("Could not save activity weights — total must equal 100%.");
```

**Rules:**

- One `<ToastContainer />` mounted once at the app root.
- Messages are always human-readable domain language ("Activity weights must total 100%"), never a raw exception string.
- Success toasts confirm the domain outcome (e.g. that SMS/email were dispatched), not just "Saved."

---

## framer-motion

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.18 }}
>
  <ActivityCard />
</motion.div>;
```

**Rules:** see `ui-rules.md` → Motion for timing/stagger rules. Never animate a marks table's row order on sort.

---

## lucide-react

Import icons individually — never a barrel/wildcard import.

```tsx
import { ShieldCheck, Users, Calendar, Upload } from "lucide-react";
```

Suggested semantic mapping (keep consistent once chosen, add to `ui-registry.md`): `ShieldCheck` — Directing Staff / approval; `Users` — Officers/roster; `Calendar` — Timetable; `Upload` — Submissions; `Award` — grades/degree class; `Bell` — notifications; `Archive` — archived courses.

---

## Django REST Framework + SimpleJWT

### Custom Login (army number, not email)

```python
# server/accounts/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class ArmyNumberTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "army_number"

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
```

```python
# server/config/settings/base.py
AUTH_USER_MODEL = "accounts.User"
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}
```

**Rules:**

- `User.USERNAME_FIELD = "army_number"` on the custom user model — never re-add Django's default `username` field.
- Initial password generation (4-digit) happens in `accounts/services/password.py` at user-creation time, hashed immediately via Django's password hasher before saving — the plaintext 4-digit password is only ever returned once, in the registration response, for the Admin to relay to the user (SMS/email), never logged or stored in plaintext.
- Password policy (8+ chars, upper, lower, digit, special) is enforced by a custom `validate_password` validator registered in `AUTH_PASSWORD_VALIDATORS`, applied on every password change — including the forced first change.

### Permissions

```python
# server/common/permissions.py
class IsNotArchived(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        course = obj.course if hasattr(obj, "course") else obj
        return course.status != "archived"
```

**Rules:** every ViewSet touching course-scoped data includes `IsNotArchived` alongside its role permission. Role permissions (`IsAdmin`, `IsDirectingStaff`, `IsOfficer`) check `request.user.role` — never infer role from the URL alone.

---

## Cloudinary (production media)

```python
# server/config/settings/production.py
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": env("CLOUDINARY_API_KEY"),
    "API_SECRET": env("CLOUDINARY_API_SECRET"),
}
DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
```

**Rules:** submission files upload as `raw` resource type (they're documents, not images) — never let Cloudinary's default `image` resource type truncate a `.docx`/`.pdf`. In development, the same `FileField` writes to local `MEDIA_ROOT` with no code branching needed — only the settings module differs.

---

## EgoSms (SMS channel)

```python
# server/announcements/services/sms.py
import requests

def send_sms(phone_number: str, message: str) -> bool:
    try:
        response = requests.get(
            "https://www.egosms.co/api/v1/plain/",
            params={
                "number": phone_number,
                "message": message,
                "username": settings.EGOSMS_USERNAME,
                "password": settings.EGOSMS_PASSWORD,
                "sender": settings.EGOSMS_SENDER_ID,
            },
            timeout=10,
        )
        return response.ok and "OK" in response.text
    except requests.RequestException:
        logger.exception("[announcements/sms] EgoSms delivery failed")
        return False
```

**Rules:** always wrapped in try/except with a timeout; a failed SMS send is logged and recorded as `sms_status="failed"` on the `Notification` row — it never raises up and blocks the email send or the in-app notification for the same announcement.

---

## Gmail SMTP (email channel)

```python
# server/config/settings/base.py
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")  # Gmail App Password, never the account password
```

**Rules:** use a Gmail **App Password**, never the real account password, and never commit it — it comes from `.env.production`/`.env.development` only. Email sends are wrapped the same way as SMS — failure is logged and recorded per-recipient, never fatal to the rest of the announcement fan-out.

---

## Plagiarism Detection (scikit-learn + python-docx + pdfplumber)

### Text Extraction

```python
# server/assessments/services/text_extraction.py
import docx
import pdfplumber

def extract_text(file_path: str, file_type: str) -> str | None:
    try:
        if file_type == "docx":
            document = docx.Document(file_path)
            return "\n".join(p.text for p in document.paragraphs)
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception:
        logger.exception("[assessments/text_extraction] failed for %s", file_path)
        return None
```

### Similarity Scoring

```python
# server/assessments/services/plagiarism.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def score_submission(new_text: str, other_texts: list[tuple[str, str]]) -> tuple[float, list[dict]]:
    # other_texts: [(submission_id, text), ...] for every other submission on the same assessment
    if not other_texts:
        return 0.0, []

    corpus = [new_text] + [text for _, text in other_texts]
    vectors = TfidfVectorizer(stop_words="english").fit_transform(corpus)
    similarities = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    matches = sorted(
        (
            {"submission_id": sid, "similarity_percent": round(sim * 100, 1)}
            for (sid, _), sim in zip(other_texts, similarities)
        ),
        key=lambda m: m["similarity_percent"],
        reverse=True,
    )
    top_score = matches[0]["similarity_percent"] if matches else 0.0
    return top_score, matches[:5]
```

**Rules:**

- Runs synchronously right after a `Submission` save — cohort sizes per activity are small (tens of officers), so this stays fast enough without a task queue. Revisit with a background worker only if activity size grows well beyond a single course's cohort.
- Comparison scope is always the current activity's other submissions — never the whole database.
- `stop_words="english"` is a deliberate default; if the college later wants this tuned per language given the multi-country officer intake, that's a config change to this one function, not a rewrite.
- Never let a `sklearn`/`pdfplumber` exception propagate past this service — catch, log with the `[assessments/plagiarism]` prefix, and set `PlagiarismReport.status = "failed"`.
- Never call this service from anywhere that could run twice for the same submission (e.g. a retry that re-triggers it) without first checking `PlagiarismReport.status != "pending"` to avoid duplicate reports.

---

## Temperature / Threshold-style Constants

This project has no AI model calls, so there's no temperature setting to document. The equivalent "never hardcode this number twice" constants are the **grading bands** and **password policy regex**, both centralized as described in `code-standards.md`.
