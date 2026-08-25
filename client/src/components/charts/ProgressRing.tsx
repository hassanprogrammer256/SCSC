import { RadialBar, RadialBarChart } from "recharts";
import Typography from "@mui/joy/Typography";
import { useAppSelector } from "@/app/hooks";
import { selectThemeMode } from "@/app/themeSlice";
import { neutrals, rolePalettes, semantic } from "@/theme/tokens";
import { selectCurrentUser } from "@/features/auth/authSlice";

type Props = {
  percent: number;
  label?: string;
};

// Fill color follows the three-state spec in context/ui-tokens.md → Progress
// Ring: role primary below 50%, warning 50–79%, success 80–100%.
export function ProgressRing({ percent, label = "Course Progress" }: Props) {
  const mode = useAppSelector(selectThemeMode);
  const user = useAppSelector(selectCurrentUser);
  const roleKey = user?.role ?? "officer";
  const fill = percent >= 80 ? semantic[mode].success : percent >= 50 ? semantic[mode].warning : rolePalettes[roleKey][mode].primary;

  const data = [{ name: "progress", value: percent, fill }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-44 w-44">
        <RadialBarChart
          width={176}
          height={176}
          cx="50%"
          cy="50%"
          innerRadius="78%"
          outerRadius="100%"
          barSize={8}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="value" background={{ fill: neutrals[mode].surfaceSecondary }} cornerRadius={8} />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Typography sx={{ color: "var(--color-text-primary)", fontSize: "28px", fontWeight: 700 }}>{percent}%</Typography>
        </div>
      </div>
      <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
        {label}
      </Typography>
    </div>
  );
}
