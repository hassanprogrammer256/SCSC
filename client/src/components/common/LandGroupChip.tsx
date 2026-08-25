import Chip from "@mui/joy/Chip";
import type { LandGroupName } from "@/types";

const labels: Record<LandGroupName, string> = { red: "Red Land", blue: "Blue Land" };

type Props = {
  landGroup: LandGroupName;
};

export function LandGroupChip({ landGroup }: Props) {
  const bg = landGroup === "red" ? "var(--color-red-land-light)" : "var(--color-blue-land-light)";
  const fg = landGroup === "red" ? "var(--color-red-land)" : "var(--color-blue-land)";

  return (
    <Chip
      size="sm"
      variant="soft"
      sx={{
        backgroundColor: bg,
        color: fg,
        fontWeight: 600,
        fontSize: "12px",
        borderRadius: "var(--radius-full)",
      }}
    >
      {labels[landGroup]}
    </Chip>
  );
}
