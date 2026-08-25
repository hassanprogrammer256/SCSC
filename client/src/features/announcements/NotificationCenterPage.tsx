import { useEffect } from "react";
import { Bell } from "lucide-react";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip } from "@/components/common/StatusChip";
import { fetchNotifications, markNotificationRead, selectNotifications } from "@/features/announcements/notificationsSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { formatDateTime } from "@/lib/utils";

// Officer-only full page (/officer/announcements) — Officers only ever
// receive, never compose, per project-overview.md's page list. Admin/DS use
// the topbar bell for received notifications; their /announcements route is
// the composer (AnnouncementComposerPage).
export function NotificationCenterPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Announcements
      </Typography>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="No announcements yet" description="Announcements from Admin and your Directing Staff will appear here." />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className="cursor-pointer"
            >
              <div
                className="flex items-start justify-between gap-3"
                onClick={() => !notification.isRead && dispatch(markNotificationRead(notification.id))}
              >
                <div className="flex flex-col gap-1">
                  <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: notification.isRead ? 500 : 700 }}>
                    {notification.title}
                  </Typography>
                  <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                    {notification.body}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                    From {notification.senderName} — {formatDateTime(notification.createdAt)}
                  </Typography>
                </div>
                {!notification.isRead ? <StatusChip label="New" tone="info" /> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
