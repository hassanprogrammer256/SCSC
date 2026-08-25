import { Construction } from "lucide-react";
import Typography from "@mui/joy/Typography";

type Props = {
  title: string;
};

export function ComingSoon({ title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-16 text-center">
      <Construction size={32} className="text-text-muted" />
      <Typography level="title-lg" sx={{ color: "var(--color-text-primary)" }}>
        {title}
      </Typography>
      <Typography level="body-sm" sx={{ color: "var(--color-text-muted)" }}>
        This page is not built yet — it will arrive in a later phase of the build plan.
      </Typography>
    </div>
  );
}
