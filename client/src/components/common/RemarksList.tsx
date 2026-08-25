import { MessageSquareQuote } from "lucide-react";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import type { OfficerActivityProgress } from "@/types";

type Props = {
  activities: OfficerActivityProgress[];
};

export function RemarksList({ activities }: Props) {
  const withRemarks = activities.filter((activity) => activity.remarks);

  return (
    <Card title="Latest Remarks">
      <div className="flex flex-col gap-4">
        {withRemarks.map((activity) => (
          <div key={activity.activityId} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
              <MessageSquareQuote size={16} className="text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                {activity.activityName}
              </Typography>
              <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)" }}>
                "{activity.remarks}"
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
