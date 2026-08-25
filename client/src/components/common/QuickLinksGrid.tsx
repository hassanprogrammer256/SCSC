import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import type { StatCardColor } from "@/components/common/StatCard";

export type QuickLink = {
  label: string;
  path: string;
  icon: LucideIcon;
  color: StatCardColor;
};

const colorClasses: Record<StatCardColor, { bg: string; fg: string }> = {
  primary: { bg: "bg-primary-light", fg: "text-primary" },
  info: { bg: "bg-info-light", fg: "text-info" },
  accent: { bg: "bg-accent-light", fg: "text-accent" },
  success: { bg: "bg-success-light", fg: "text-success" },
  warning: { bg: "bg-warning-light", fg: "text-warning" },
  error: { bg: "bg-error-light", fg: "text-error" },
};

type Props = {
  links: QuickLink[];
};

export function QuickLinksGrid({ links }: Props) {
  return (
    <Card title="Quick Links">
      <div className="grid grid-cols-2 gap-3">
        {links.map(({ label, path, icon: Icon, color }) => {
          const classes = colorClasses[color];
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-2 rounded-lg ${classes.bg} px-3 py-4 text-center transition-opacity hover:opacity-80`}
            >
              <Icon size={20} className={classes.fg} />
              <Typography level="body-xs" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                {label}
              </Typography>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
