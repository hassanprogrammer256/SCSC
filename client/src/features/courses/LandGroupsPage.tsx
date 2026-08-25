import Typography from "@mui/joy/Typography";
import { LandGroupsPanel } from "@/features/courses/LandGroupsPanel";

export function LandGroupsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Land Groups
      </Typography>
      <LandGroupsPanel />
    </div>
  );
}
