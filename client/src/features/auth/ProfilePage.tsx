import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { Camera, Check, X } from "lucide-react";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { changePassword, selectCurrentUser, uploadAvatar } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { initials } from "@/lib/utils";

const labelSx = { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" } as const;

const POLICY_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One digit", test: (pw) => /\d/.test(pw) },
  { label: "One special character", test: (pw) => /[^\w\s]/.test(pw) },
];

function PolicyItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {met ? <Check size={14} className="text-success" /> : <X size={14} className="text-text-muted" />}
      <Typography level="body-xs" sx={{ color: met ? "var(--color-success)" : "var(--color-text-muted)" }}>
        {label}
      </Typography>
    </div>
  );
}

// Shared by /admin/profile, /ds/profile, /officer/profile — role-agnostic,
// reads everything from the authenticated user in Redux. Avatar upload uses
// User.avatar (local MEDIA_ROOT in dev / Cloudinary in prod — see
// context/architecture.md → Media Storage). The password policy checklist
// mirrors accounts/validators.py's PasswordPolicyValidator, the same rules
// enforced server-side.
export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  if (!user) return null;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    dispatch(uploadAvatar(file))
      .unwrap()
      .then(() => toast.success("Profile photo updated."))
      .catch((error) => toast.error(typeof error === "string" ? error : "Could not update your photo."))
      .finally(() => setUploading(false));
  }

  const policyMet = POLICY_RULES.every((rule) => rule.test(newPassword));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && policyMet && passwordsMatch;

  async function handleChangePassword() {
    setChanging(true);
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not change your password.");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Profile
      </Typography>

      <Card>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar src={user.avatarUrl} size="lg" sx={{ "--Avatar-size": "88px", fontSize: "28px" }}>
              {user.avatarUrl ? null : initials(user.fullName)}
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2"
              style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-surface)" }}
              aria-label="Change profile photo"
            >
              {uploading ? (
                <CircularProgress size="sm" sx={{ "--CircularProgress-size": "16px", "--CircularProgress-trackColor": "transparent" }} />
              ) : (
                <Camera size={14} color="#FFFFFF" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex flex-col gap-1">
            <Typography level="title-md" sx={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
              {user.rank} {user.fullName}
            </Typography>
            <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
              {user.armyNumber}
            </Typography>
            <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
              {user.country}
            </Typography>
          </div>
        </div>
      </Card>

      <Card title="Contact Details">
        <Stack spacing={2} sx={{ maxWidth: "420px" }}>
          <FormControl disabled>
            <FormLabel sx={labelSx}>Phone Number</FormLabel>
            <Input value={user.phoneNumber || "—"} readOnly />
          </FormControl>
          <FormControl disabled>
            <FormLabel sx={labelSx}>Email</FormLabel>
            <Input value={user.email || "—"} readOnly />
          </FormControl>
        </Stack>
      </Card>

      <Card title="Change Password">
        <Stack spacing={2} sx={{ maxWidth: "420px" }}>
          <FormControl required>
            <FormLabel sx={labelSx}>Current Password</FormLabel>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </FormControl>
          <FormControl required>
            <FormLabel sx={labelSx}>New Password</FormLabel>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </FormControl>
          <FormControl required error={confirmPassword.length > 0 && !passwordsMatch}>
            <FormLabel sx={labelSx}>Confirm New Password</FormLabel>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </FormControl>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-secondary p-3">
            {POLICY_RULES.map((rule) => (
              <PolicyItem key={rule.label} label={rule.label} met={rule.test(newPassword)} />
            ))}
          </div>
          <Button color="primary" loading={changing} disabled={!canSubmit} onClick={handleChangePassword}>
            Change Password
          </Button>
        </Stack>
      </Card>
    </div>
  );
}
