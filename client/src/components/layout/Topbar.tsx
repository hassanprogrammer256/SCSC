import { useNavigate } from "react-router-dom";
import { Bell, Menu as MenuIcon, Moon, Search, Sun } from "lucide-react";
import Avatar from "@mui/joy/Avatar";
import Badge from "@mui/joy/Badge";
import Dropdown from "@mui/joy/Dropdown";
import Input from "@mui/joy/Input";
import IconButton from "@mui/joy/IconButton";
import ListDivider from "@mui/joy/ListDivider";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Typography from "@mui/joy/Typography";
import type { AppNotification, Course, User } from "@/types";
import type { ThemeMode } from "@/theme/tokens";
import { formatDateTime, initials } from "@/lib/utils";
import { clearSession } from "@/features/auth/authSlice";
import { useAppDispatch } from "@/app/hooks";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type Props = {
  user: User;
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  notifications: AppNotification[];
  unreadCount: number;
  onOpenNotification: (notification: AppNotification) => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
};

const roleAnnouncementsPath: Record<User["role"], string> = {
  admin: "/admin/announcements",
  directing_staff: "/ds/announcements",
  officer: "/officer/announcements",
};

// White background, 64px height, per context/ui-rules.md → Topbar.
export function Topbar({
  user,
  courses,
  selectedCourseId,
  onSelectCourse,
  notifications,
  unreadCount,
  onOpenNotification,
  themeMode,
  onToggleTheme,
  onToggleSidebar,
}: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await apiClient.post(endpoints.logout);
    } catch {
      // Session is cleared client-side regardless — a failed logout call
      // shouldn't trap the user on the page.
    }
    dispatch(clearSession());
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-4">
        <IconButton variant="plain" color="neutral" size="sm" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <MenuIcon size={18} />
        </IconButton>
        <Input
          size="sm"
          startDecorator={<Search size={16} />}
          placeholder="Search…"
          sx={{ width: "260px", display: { xs: "none", md: "flex" } }}
        />
      </div>

      <div className="flex items-center gap-3">
        <Select
          size="sm"
          value={selectedCourseId}
          onChange={(_, value) => value && onSelectCourse(value)}
          sx={{ minWidth: "160px" }}
        >
          {courses.map((course) => (
            <Option key={course.id} value={course.id}>
              {course.code}
              {course.status === "archived" ? " — Archived" : ""}
            </Option>
          ))}
        </Select>

        <Dropdown>
          <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: "plain", color: "neutral", size: "sm" } }}>
            <Badge
              badgeContent={unreadCount}
              size="sm"
              sx={{ "--Badge-ringColor": "var(--color-surface)", "& .MuiBadge-badge": { backgroundColor: "var(--color-error)", color: "var(--color-text-inverse)" } }}
            >
              <Bell size={18} />
            </Badge>
          </MenuButton>
          <Menu placement="bottom-end" sx={{ minWidth: "320px" }}>
            <Typography level="body-xs" sx={{ px: 2, py: 1, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Notifications
            </Typography>
            {notifications.length === 0 ? (
              <Typography level="body-xs" sx={{ px: 2, py: 2, color: "var(--color-text-muted)" }}>
                No notifications yet.
              </Typography>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => onOpenNotification(notification)}
                  sx={{ flexDirection: "column", alignItems: "flex-start", gap: "2px", opacity: notification.isRead ? 0.6 : 1 }}
                >
                  <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: notification.isRead ? 400 : 600 }}>
                    {notification.title}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                    {formatDateTime(notification.createdAt)}
                  </Typography>
                </MenuItem>
              ))
            )}
            <ListDivider />
            <MenuItem onClick={() => navigate(roleAnnouncementsPath[user.role])}>View All</MenuItem>
          </Menu>
        </Dropdown>

        <IconButton variant="plain" color="neutral" size="sm" onClick={onToggleTheme} aria-label="Toggle theme">
          {themeMode === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </IconButton>

        <Dropdown>
          <MenuButton
            slots={{ root: "button" }}
            slotProps={{ root: { className: "flex items-center gap-2" } }}
          >
            <Avatar src={user.avatarUrl} size="sm">
              {user.avatarUrl ? null : initials(user.fullName)}
            </Avatar>
          </MenuButton>
          <Menu placement="bottom-end" sx={{ minWidth: "200px" }}>
            <div className="flex flex-col gap-0.5 px-3 py-2">
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                {user.rank} {user.fullName}
              </Typography>
              <Typography level="body-xs" sx={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                {user.armyNumber}
              </Typography>
            </div>
            <ListDivider />
            <MenuItem onClick={() => navigate(`/${user.role === "directing_staff" ? "ds" : user.role}/profile`)}>Profile</MenuItem>
            <MenuItem onClick={() => navigate(`/${user.role === "directing_staff" ? "ds" : user.role}/profile`)}>
              Change Password
            </MenuItem>
            <ListDivider />
            <MenuItem
              onClick={handleLogout}
              sx={{ color: "var(--color-error)", "&:hover": { backgroundColor: "var(--color-error-light)" } }}
            >
              Sign Out
            </MenuItem>
          </Menu>
        </Dropdown>
      </div>
    </header>
  );
}
