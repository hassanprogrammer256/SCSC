import { StatusChip } from "@/components/common/StatusChip";

type Props = {
  total: number;
};

// context/ui-tokens.md → Weight Total Indicator: three-state running total
// for the Activity weight editor. Purely informational — the server only
// ever blocks a save that would push the total ABOVE 100%; sitting below is
// a normal in-progress state, same as a course with 0 officers registered
// (see build-plan.md Phase 3 /architect decision log).
export function WeightTotalBadge({ total }: Props) {
  // `total` is a running sum of floating-point weightPercent values (e.g.
  // 3.33 repeated) — plain addition drifts to things like
  // 99.99999999999996 well before it ever hits exactly 100, so both the
  // display text and the >/=== checks below round first rather than
  // trusting raw float equality.
  const display = total.toFixed(2);
  const rounded = Math.round(total * 100) / 100;
  if (rounded > 100) {
    return <StatusChip tone="error" label={`Weights total ${display}% — exceeds 100%`} />;
  }
  if (rounded === 100) {
    return <StatusChip tone="success" label="Weights total 100% ✓" />;
  }
  return <StatusChip tone="warning" label={`Weights total ${display}% — ${(100 - total).toFixed(2)}% remaining`} />;
}
