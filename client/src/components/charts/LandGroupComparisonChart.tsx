import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/common/Card";
import { useAppSelector } from "@/app/hooks";
import { selectThemeMode } from "@/app/themeSlice";
import { neutrals, semantic } from "@/theme/tokens";

type Props = {
  data: { activity: string; red: number; blue: number }[];
};

// Recharts needs literal hex values, not var(--...) — see context/architecture.md
// Invariants for why raw hex never appears in component markup itself; the
// values here are still sourced from theme/tokens.ts, never re-declared.
export function LandGroupComparisonChart({ data }: Props) {
  const mode = useAppSelector(selectThemeMode);
  const tone = semantic[mode];
  const grid = neutrals[mode].border;
  const axisText = neutrals[mode].textMuted;

  return (
    <Card title="Red Land vs Blue Land — Average Score">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="activity" tick={{ fill: axisText, fontSize: 12 }} axisLine={{ stroke: grid }} tickLine={false} />
            <YAxis tick={{ fill: axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: neutrals[mode].surface, border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: axisText }} formatter={(value) => (value === "red" ? "Red Land" : "Blue Land")} />
            <Bar dataKey="red" fill={tone.redLand} radius={[4, 4, 0, 0]} />
            <Bar dataKey="blue" fill={tone.blueLand} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
