import Chip from "@mui/joy/Chip";
import type { PlagiarismStatus } from "@/types";

type Props = {
  status: PlagiarismStatus;
  score: number | null;
};

// DS-only — a component rendering this must never be reachable from an
// Officer or Admin route. See context/ui-tokens.md → Plagiarism Score Badge.
export function PlagiarismChip({ status, score }: Props) {
  if (status === "not_checked") {
    return <ToneChip bg="var(--color-surface-secondary)" fg="var(--color-text-muted)" label="Not Checked" />;
  }
  if (status === "failed") {
    return <ToneChip bg="var(--color-surface-secondary)" fg="var(--color-text-muted)" label="Could not be screened" />;
  }

  const value = score ?? 0;
  if (value < 20) {
    return <ToneChip bg="var(--color-success-light)" fg="var(--color-success)" label={`${value}% — Low similarity`} />;
  }
  if (value < 40) {
    return <ToneChip bg="var(--color-warning-light)" fg="var(--color-warning)" label={`${value}% — Review recommended`} />;
  }
  return <ToneChip bg="var(--color-error-light)" fg="var(--color-error)" label={`${value}% — High similarity`} />;
}

function ToneChip({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <Chip
      size="sm"
      variant="soft"
      sx={{ backgroundColor: bg, color: fg, fontWeight: 600, fontSize: "12px", borderRadius: "var(--radius-full)" }}
    >
      {label}
    </Chip>
  );
}
