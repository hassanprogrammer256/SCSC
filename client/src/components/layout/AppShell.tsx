import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectThemeMode, toggleThemeMode } from "@/app/themeSlice";
import { navConfigByRole, roleDataAttr } from "@/app/navConfig";
import { fetchCourses, selectActiveCourse, selectCourses } from "@/features/courses/coursesSlice";
import {
  fetchNotifications,
  markNotificationRead,
  selectNotifications,
  selectUnreadCount,
} from "@/features/announcements/notificationsSlice";
import { selectCurrentUser } from "@/features/auth/authSlice";
import type { AppNotification } from "@/types";

export type AppShellContext = {
  selectedCourseId: string | null;
};

// Sets data-role/data-theme on <html> from session + local preference — the
// only two axes that ever change component color, per context/ui-tokens.md.
export function AppShell() {
  const user = useAppSelector(selectCurrentUser);
  const themeMode = useAppSelector(selectThemeMode);
  const courses = useAppSelector(selectCourses);
  const activeCourse = useAppSelector(selectActiveCourse);
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (user) document.documentElement.setAttribute("data-role", roleDataAttr[user.role]);
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchNotifications());
  }, [dispatch]);

  function handleOpenNotification(notification: AppNotification) {
    if (!notification.isRead) dispatch(markNotificationRead(notification.id));
  }

  if (!user) return null;

  // The active course is the default topbar selection until the user (Admin
  // only — DS/Officer only ever have one course to pick from) explicitly
  // picks a different one; derived at render time rather than synced via an
  // effect, since there's nothing external to subscribe to here.
  const resolvedCourseId = selectedCourseId ?? activeCourse?.id ?? courses[0]?.id ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar groups={navConfigByRole[user.role]} collapsed={collapsed} />
      <div className="flex flex-col transition-[margin] duration-200" style={{ marginLeft: collapsed ? "72px" : "280px" }}>
        <Topbar
          user={user}
          courses={courses}
          selectedCourseId={resolvedCourseId ?? ""}
          onSelectCourse={setSelectedCourseId}
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenNotification={handleOpenNotification}
          themeMode={themeMode}
          onToggleTheme={() => dispatch(toggleThemeMode())}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
        />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6">
          <Outlet context={{ selectedCourseId: resolvedCourseId } satisfies AppShellContext} />
        </main>
      </div>
    </div>
  );
}
