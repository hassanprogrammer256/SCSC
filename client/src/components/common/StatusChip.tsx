import Chip from "@mui/joy/Chip";

export type StatusTone = "success" | "warning" | "error" | "info";

type Props = {
  label: string;
  tone: StatusTone;
};

export function StatusChip({ label, tone }: Props) {
  return (
    <Chip
      size="sm"
      variant="soft"
      sx={{
        backgroundColor: `var(--color-${tone}-light)`,
        color: `var(--color-${tone})`,
        fontWeight: 600,
        fontSize: "12px",
        borderRadius: "var(--radius-full)",
      }}
    >
      {label}
    </Chip>
  );
}
