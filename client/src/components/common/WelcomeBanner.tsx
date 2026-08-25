import type { ReactNode } from "react";
import Typography from "@mui/joy/Typography";

type Props = {
  greeting: string;
  name: string;
  subtitle: string;
  note?: string;
  action?: ReactNode;
};

// Full-width banner using primary/primaryDark as an intentional, singular
// per-page accent — the one exception to "never a colored card background"
// (context/ui-rules.md → Cards).
export function WelcomeBanner({ greeting, name, subtitle, note, action }: Props) {
  return (
    <div
      className="flex flex-col gap-2 rounded-2xl p-6"
      style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* Always white, not var(--color-text-inverse) — this banner's
              primary→primaryDark gradient stays dark-skewed in both theme
              modes (same reasoning as Sidebar.tsx), but textInverse flips to
              near-black in dark mode and would be unreadable here. The
              subtitle/note below already used a hardcoded white for this
              same reason — this just matches them. */}
          <Typography level="h3" sx={{ color: "#FFFFFF", fontSize: "22px", fontWeight: 700 }}>
            {greeting}, {name}
          </Typography>
          <Typography level="body-sm" sx={{ color: "rgba(255,255,255,0.85)" }}>
            {subtitle}
          </Typography>
          {note ? (
            <Typography level="body-sm" sx={{ color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>
              {note}
            </Typography>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}
