import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { PlagiarismChip } from "@/components/common/PlagiarismChip";
import type { PendingMarkingItem } from "@/types";
import { formatDateTime } from "@/lib/utils";

type Props = {
  items: PendingMarkingItem[];
};

// DS-only (only ever mounted on DsDashboard) — plagiarism status shown
// before any marks input, per context/ui-rules.md → Tables (Rosters, Marks
// Sheets, Timetables).
export function PendingMarkingList({ items }: Props) {
  return (
    <Card title="Pending Marking">
      <div className="flex flex-col">
        {items.map((item) => (
          <div key={item.submissionId} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
            <div className="flex flex-col gap-1">
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                {item.officerName}{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", fontWeight: 400 }}>
                  {item.armyNumber}
                </span>
              </Typography>
              <div className="flex items-center gap-2">
                <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)" }}>
                  {item.activityName}
                </Typography>
                <LandGroupChip landGroup={item.landGroup} />
              </div>
              <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                Submitted {formatDateTime(item.submittedAt)}
              </Typography>
            </div>
            <PlagiarismChip status={item.plagiarismStatus} score={item.plagiarismScore} />
          </div>
        ))}
      </div>
    </Card>
  );
}
