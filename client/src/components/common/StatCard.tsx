import type { LucideIcon } from "lucide-react";
import Typography from "@mui/joy/Typography";

export type StatCardColor = "primary" | "info" | "accent" | "success" | "warning" | "error";

const colorClasses: Record<StatCardColor, { bg: string; fg: string }> = {
  primary: { bg: "bg-primary-light", fg: "text-primary" },
  info: { bg: "bg-info-light", fg: "text-info" },
  accent: { bg: "bg-accent-light", fg: "text-accent" },
  success: { bg: "bg-success-light", fg: "text-success" },
  warning: { bg: "bg-warning-light", fg: "text-warning" },
  error: { bg: "bg-error-light", fg: "text-error" },
};

type Props = {
  icon: LucideIcon;
  value: string | number;
  label: string;
  subLine?: string;
  color: StatCardColor;
};

export function StatCard({ icon: Icon, value, label, subLine, color }: Props) {
  const classes = colorClasses[color];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(19,34,61,0.08),0px_1px_2px_rgba(19,34,61,0.06)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${classes.bg}`}>
        <Icon size={20} className={classes.fg} />
      </div>
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "28px", fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
        {label}
      </Typography>
      {subLine ? (
        <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
          {subLine}
        </Typography>
      ) : null}
    </div>
  );
}
