import { ChevronLeft, ChevronRight } from "lucide-react";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  year: number;
  month: number; // 0-indexed
  today: number;
  highlightDays?: number[];
};

// Read-only month grid — no navigation wired yet, this is a preview of the
// Timetable feature (context/build-plan.md Phase 4).
export function MiniCalendar({ year, month, today, highlightDays = [] }: Props) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <Card
      title={monthLabel}
      action={
        <div className="flex items-center gap-1 text-text-muted">
          <ChevronLeft size={16} />
          <ChevronRight size={16} />
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAYS.map((day, i) => (
          <Typography key={`${day}-${i}`} level="body-xs" sx={{ color: "var(--color-text-muted)", fontWeight: 600 }}>
            {day}
          </Typography>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today;
          const isHighlighted = day !== null && highlightDays.includes(day);
          return (
            <div key={i} className="flex items-center justify-center py-1">
              {day ? (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[13px]"
                  style={
                    isToday
                      ? { backgroundColor: "var(--color-primary)", color: "var(--color-text-inverse)", fontWeight: 600 }
                      : isHighlighted
                        ? { backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 600 }
                        : { color: "var(--color-text-primary)" }
                  }
                >
                  {day}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
