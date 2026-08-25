import { NavLink } from "react-router-dom";
import Typography from "@mui/joy/Typography";
import type { NavGroup } from "@/app/navConfig";

type Props = {
  groups: NavGroup[];
  collapsed: boolean;
};

// Sidebar background is always primaryDark (role-dependent) — the one
// always-colored surface in the system. See context/ui-rules.md → Sidebar.
export function Sidebar({ groups, collapsed }: Props) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex flex-col overflow-y-auto transition-[width] duration-200"
      style={{ width: collapsed ? "72px" : "280px", backgroundColor: "var(--color-primary-dark)" }}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <img
          src="/scsc-logo.jpg"
          alt="SCSC crest"
          className="h-10 w-10 shrink-0 rounded-full object-cover"
          style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.25)" }}
        />
        {!collapsed ? (
          <div className="flex flex-col leading-tight">
            {/* Always white, never var(--color-text-inverse) — this text sits
                on the sidebar's own primaryDark background, which stays dark
                in BOTH theme modes (it's the one theme-independent colored
                surface, see ui-rules.md → Sidebar), but textInverse flips to
                near-black in dark mode, which would be unreadable here. */}
            <Typography sx={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 700 }}>SCSC ERP</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "11px" }}>Jinja — Kimaka</Typography>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-5 px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {!collapsed ? (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  px: "12px",
                  mb: "2px",
                }}
              >
                {group.label}
              </Typography>
            ) : null}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                    isActive ? "" : "hover:text-white"
                  }`
                }
                style={({ isActive }) => ({
                  // Always white when active, not var(--color-text-inverse) —
                  // same reasoning as the title above.
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.72)",
                  backgroundColor: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                  borderLeft: isActive ? "4px solid var(--color-accent)" : "4px solid transparent",
                })}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
