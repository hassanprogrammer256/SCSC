import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { StatusChip, type StatusTone } from "@/components/common/StatusChip";
import { GradeChip } from "@/components/common/GradeChip";
import type { OfficerActivityProgress, SubmissionStatus } from "@/types";

type Props = {
  activities: OfficerActivityProgress[];
};

const statusMeta: Record<SubmissionStatus, { label: string; tone: StatusTone }> = {
  not_submitted: { label: "Not Submitted", tone: "warning" },
  submitted: { label: "Submitted", tone: "info" },
  late: { label: "Late", tone: "error" },
  marked: { label: "Marked", tone: "success" },
};

export function ActivityStatusList({ activities }: Props) {
  return (
    <Card title="My Activities">
      <div className="flex flex-col">
        {activities.map((activity) => {
          const meta = statusMeta[activity.status];
          return (
            <div key={activity.activityId} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
              <div className="flex flex-col gap-1">
                <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {activity.activityName}
                </Typography>
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  Weight {activity.weightPercent}%
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip label={meta.label} tone={meta.tone} />
                {activity.gradeBand ? <GradeChip band={activity.gradeBand} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
