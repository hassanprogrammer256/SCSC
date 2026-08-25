import type { ReactNode } from "react";
import Typography from "@mui/joy/Typography";

type Props = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

// Every content block lives in a card — context/ui-rules.md → Cards.
export function Card({ title, action, children, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(19,34,61,0.08),0px_1px_2px_rgba(19,34,61,0.06)] ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between">
          <Typography level="title-md" sx={{ color: "var(--color-text-primary)", fontSize: "16px", fontWeight: 600 }}>
            {title}
          </Typography>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}
