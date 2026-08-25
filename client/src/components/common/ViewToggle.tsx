import { LayoutGrid, List } from "lucide-react";
import IconButton from "@mui/joy/IconButton";

export type ViewMode = "grid" | "list";

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

// Toolbar grid/list toggle for Officer & DS registries — context/ui-rules.md
// → Grid / List Toggle.
export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1">
      <IconButton
        size="sm"
        variant={value === "grid" ? "soft" : "plain"}
        color={value === "grid" ? "primary" : "neutral"}
        onClick={() => onChange("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid size={16} />
      </IconButton>
      <IconButton
        size="sm"
        variant={value === "list" ? "soft" : "plain"}
        color={value === "list" ? "primary" : "neutral"}
        onClick={() => onChange("list")}
        aria-label="List view"
      >
        <List size={16} />
      </IconButton>
    </div>
  );
}
