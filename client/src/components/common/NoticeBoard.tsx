import { Megaphone } from "lucide-react";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import type { NoticeItem } from "@/types";
import { formatDate } from "@/lib/utils";

type Props = {
  notices: NoticeItem[];
};

export function NoticeBoard({ notices }: Props) {
  return (
    <Card title="Notice Board">
      <div className="flex flex-col gap-4">
        {notices.map((notice) => (
          <div key={notice.id} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-light">
              <Megaphone size={16} className="text-info" />
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {notice.title}
                </Typography>
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  Added on {formatDate(notice.addedOn)}
                </Typography>
              </div>
              <Typography level="body-xs" sx={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                {notice.daysLeft} days ago
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
