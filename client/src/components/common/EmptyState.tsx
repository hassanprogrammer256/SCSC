import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Typography from "@mui/joy/Typography";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

// context/ui-rules.md → Empty States: muted icon + short text, CTA only when
// the current role has a real next action.
export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon size={28} className="text-text-muted" />
      <Typography level="body-sm" sx={{ color: "var(--color-text-muted)", fontWeight: 500 }}>
        {title}
      </Typography>
      {description ? (
        <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
          {description}
        </Typography>
      ) : null}
      {action}
    </div>
  );
}
