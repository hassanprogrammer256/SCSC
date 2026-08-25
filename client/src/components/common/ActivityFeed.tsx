import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import type { ActivityFeedItem } from "@/types";
import { formatDateTime } from "@/lib/utils";

type Props = {
  items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: Props) {
  return (
    <Card title="Recent Activity">
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex gap-3 pl-1">
            <div className="relative flex flex-col items-center">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              {index < items.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
            </div>
            <div className="flex flex-1 flex-col gap-0.5 pb-1">
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)" }}>
                <span style={{ fontWeight: 600 }}>{item.actor}</span> {item.action}
              </Typography>
              <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                {formatDateTime(item.timestamp)}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
