import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar8 from "@/assets/avatars/avatar-8.jpg";
import avatar12 from "@/assets/avatars/avatar-12.jpg";
import avatar15 from "@/assets/avatars/avatar-15.jpg";
import avatar25 from "@/assets/avatars/avatar-25.jpg";
import avatar32 from "@/assets/avatars/avatar-32.jpg";
import avatar44 from "@/assets/avatars/avatar-44.jpg";
import avatar47 from "@/assets/avatars/avatar-47.jpg";
import avatar49 from "@/assets/avatars/avatar-49.jpg";
import avatar60 from "@/assets/avatars/avatar-60.jpg";
import avatar65 from "@/assets/avatars/avatar-65.jpg";
import avatar68 from "@/assets/avatars/avatar-68.jpg";

// Downloaded from pravatar.cc and bundled locally so the dashboards render
// fully offline — see context/progress-tracker.md decisions log.
export const avatars = {
  admin: avatar44,
  directingStaff: avatar12,
  officer: avatar25,
  pool: [avatar5, avatar8, avatar15, avatar32, avatar47, avatar49, avatar60, avatar65, avatar68],
} as const;
