import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import type { DeadlineItem } from "@/types";
import { countdownLabel, daysUntil, formatDateTime } from "@/lib/utils";

type Props = {
  title?: string;
  deadlines: DeadlineItem[];
};

// Deadline pills are bordered (not filled) so they read as "due" rather than
// a scheduled lesson — context/ui-rules.md → Calendar / Timetable & Events.
export function DeadlineList({ title = "Upcoming Deadlines", deadlines }: Props) {
  return (
    <Card title={title}>
      <div className="flex flex-col gap-3">
        {deadlines.map((item) => {
          const days = daysUntil(item.deadline);
          const tone = days < 0 || days === 0 ? "var(--color-error)" : days <= 3 ? "var(--color-warning)" : "var(--color-info)";

          return (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-col gap-1">
                <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {item.activityName}
                </Typography>
                <div className="flex items-center gap-2">
                  <Typography level="body-xs" sx={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {item.courseCode}
                  </Typography>
                  {item.landGroup === "both" ? (
                    <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                      Both Land Groups
                    </Typography>
                  ) : (
                    <LandGroupChip landGroup={item.landGroup} />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Chip size="sm" variant="outlined" sx={{ borderColor: tone, color: tone, fontWeight: 600, fontSize: "12px", borderRadius: "var(--radius-full)" }}>
                  {countdownLabel(item.deadline)}
                </Chip>
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  {formatDateTime(item.deadline)}
                </Typography>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
