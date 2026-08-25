import { useMemo, useRef } from "react";
import { Camera } from "lucide-react";
import Avatar from "@mui/joy/Avatar";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import type { RegisterPersonnelInput } from "@/types";
import { initials } from "@/lib/utils";

const labelSx = { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" } as const;

type Props = {
  value: RegisterPersonnelInput;
  onChange: (value: RegisterPersonnelInput) => void;
};

// Shared by RegisterOfficerModal and RegisterDirectingStaffModal — every
// field here is identical between the two forms; only Land Group (Officer
// only) lives outside this component.
export function PersonnelIdentityFields({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Only recomputed when the selected File actually changes — avoids
  // creating a fresh blob URL on every keystroke in the sibling fields.
  const avatarPreviewUrl = useMemo(() => (value.avatar ? URL.createObjectURL(value.avatar) : undefined), [value.avatar]);

  function set<K extends keyof RegisterPersonnelInput>(key: K, fieldValue: RegisterPersonnelInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    set("avatar", file);
  }

  return (
    <Stack spacing={2}>
      <div className="flex justify-center">
        <div className="relative">
          <Avatar src={avatarPreviewUrl} size="lg" sx={{ "--Avatar-size": "72px", fontSize: "24px" }}>
            {avatarPreviewUrl ? null : value.fullName ? initials(value.fullName) : null}
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2"
            style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-surface)" }}
            aria-label="Add profile photo"
          >
            <Camera size={13} color="#FFFFFF" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>
      <FormControl required>
        <FormLabel sx={labelSx}>Army Number</FormLabel>
        <Input
          value={value.armyNumber}
          onChange={(event) => set("armyNumber", event.target.value)}
          placeholder="e.g. UPDF-O3006"
          sx={{ fontFamily: "var(--font-mono)" }}
          required
        />
      </FormControl>
      <FormControl required>
        <FormLabel sx={labelSx}>Rank</FormLabel>
        <Input value={value.rank} onChange={(event) => set("rank", event.target.value)} placeholder="e.g. Major" required />
      </FormControl>
      <FormControl required>
        <FormLabel sx={labelSx}>Full Name</FormLabel>
        <Input value={value.fullName} onChange={(event) => set("fullName", event.target.value)} required />
      </FormControl>
      <FormControl required>
        <FormLabel sx={labelSx}>Country</FormLabel>
        <Input value={value.country} onChange={(event) => set("country", event.target.value)} placeholder="e.g. Uganda" required />
      </FormControl>
      <FormControl>
        <FormLabel sx={labelSx}>Phone Number</FormLabel>
        <Input
          value={value.phoneNumber ?? ""}
          onChange={(event) => set("phoneNumber", event.target.value)}
          placeholder="For SMS delivery"
        />
      </FormControl>
      <FormControl>
        <FormLabel sx={labelSx}>Email</FormLabel>
        <Input
          type="email"
          value={value.email ?? ""}
          onChange={(event) => set("email", event.target.value)}
          placeholder="For email delivery"
        />
      </FormControl>
    </Stack>
  );
}
