import Chip from "@mui/joy/Chip";
import type { GradeBand } from "@/types";
import { gradeBandLabel } from "@/lib/utils";

type Props = {
  band: GradeBand;
};

// Grade tokens always alias the shared semantic set (context/ui-tokens.md) —
// point straight at the underlying variable rather than a --color-distinction
// custom property, since that alias only exists inside Tailwind's @theme block.
const gradeVar: Record<GradeBand, string> = {
  distinction: "var(--color-accent)",
  merit: "var(--color-success)",
  pass: "var(--color-info)",
  fail: "var(--color-error)",
};

// Grade chips are always solid — never the soft variant used by status chips —
// so a "Fail" grade stays visually distinguishable from an "Inactive" status
// even though both read red. See context/ui-rules.md → Badges & Chips.
export function GradeChip({ band }: Props) {
  return (
    <Chip
      size="sm"
      variant="solid"
      sx={{
        backgroundColor: gradeVar[band],
        color: "var(--color-text-inverse)",
        fontWeight: 600,
        fontSize: "12px",
        borderRadius: "var(--radius-full)",
      }}
    >
      {gradeBandLabel[band]}
    </Chip>
  );
}
