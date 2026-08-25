import Typography from "@mui/joy/Typography";
import Avatar from "@mui/joy/Avatar";
import { Card } from "@/components/common/Card";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import type { RosterMember } from "@/types";

type Props = {
  title?: string;
  officers: RosterMember[];
};

export function RosterSnapshot({ title = "Roster Snapshot", officers }: Props) {
  return (
    <Card title={title}>
      <div className="flex flex-col">
        {officers.map((officer) => (
          <div key={officer.id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <Avatar src={officer.avatarUrl} size="sm" />
              <div className="flex flex-col">
                <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {officer.rank} {officer.fullName}
                </Typography>
                <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                  {officer.armyNumber}
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LandGroupChip landGroup={officer.landGroup} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
