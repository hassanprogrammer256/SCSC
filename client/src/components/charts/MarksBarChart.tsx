import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/common/Card";
import { useAppSelector } from "@/app/hooks";
import { selectThemeMode } from "@/app/themeSlice";
import { neutrals, semantic } from "@/theme/tokens";
import type { OfficerActivityProgress } from "@/types";

type Props = {
  activities: OfficerActivityProgress[];
};

// Marks distribution always renders as success-colored bars —
// context/ui-tokens.md → Chart Colors.
export function MarksBarChart({ activities }: Props) {
  const mode = useAppSelector(selectThemeMode);
  const grid = neutrals[mode].border;
  const axisText = neutrals[mode].textMuted;
  const data = activities
    .filter((activity) => activity.score !== null)
    .map((activity) => ({ name: activity.activityName.split(" ").slice(0, 2).join(" "), score: activity.score }));

  return (
    <Card title="Marks by Activity">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: axisText, fontSize: 11 }} axisLine={{ stroke: grid }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: neutrals[mode].surface, border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="score" fill={semantic[mode].success} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
