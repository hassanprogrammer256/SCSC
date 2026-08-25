import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import IconButton from "@mui/joy/IconButton";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { LessonFormModal } from "@/features/timetable/LessonFormModal";
import { fetchTimetable, selectTimetableEntries, selectTimetableStatus } from "@/features/timetable/timetableSlice";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { formatDate } from "@/lib/utils";
import type { TimetableEntry } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

function sameDay(iso: string, date: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
}

// Admin-only, standalone /admin/timetable — no CourseDetailPage tab (none is
// reserved for it, per build-plan.md Phase 4). Month grid + a dense list
// view (per ui-rules.md → Calendar / Timetable & Events Views); week/day
// toggle sub-views are trimmed for now given the sparse per-course lesson
// volume — a documented scope trim, not an oversight.
export function TimetablePage() {
  const dispatch = useAppDispatch();
  const courseId = useSelectedCourseId();
  const entries = useAppSelector(selectTimetableEntries);
  const status = useAppSelector(selectTimetableStatus);
  const activities = useAppSelector(selectActivities);

  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [cursor, setCursor] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchTimetable(courseId));
      dispatch(fetchActivities(courseId));
    }
  }, [dispatch, courseId]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => a.startAt.localeCompare(b.startAt)), [entries]);

  function openCreate(day: number | null) {
    setEditingEntry(null);
    setDefaultDate(day ? new Date(year, month, day) : null);
    setFormOpen(true);
  }

  function openEdit(entry: TimetableEntry) {
    setEditingEntry(entry);
    setDefaultDate(null);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
          Timetable
        </Typography>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <IconButton
              size="sm"
              variant={view === "calendar" ? "soft" : "plain"}
              color={view === "calendar" ? "primary" : "neutral"}
              onClick={() => setView("calendar")}
              aria-label="Calendar view"
            >
              <Calendar size={16} />
            </IconButton>
            <IconButton
              size="sm"
              variant={view === "list" ? "soft" : "plain"}
              color={view === "list" ? "primary" : "neutral"}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List size={16} />
            </IconButton>
          </div>
          <Button startDecorator={<Plus size={16} />} color="primary" onClick={() => openCreate(null)} disabled={!courseId}>
            Add Lesson
          </Button>
        </div>
      </div>

      {!courseId ? (
        <Card>
          <EmptyState icon={Calendar} title="Select a course" description="Choose a course from the topbar to view its timetable." />
        </Card>
      ) : status === "loading" && entries.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <EmptyState icon={Calendar} title="No activities defined yet" description="Add activities for this course before timetabling lessons." />
        </Card>
      ) : view === "calendar" ? (
        <Card
          title={monthLabel}
          action={
            <div className="flex items-center gap-1">
              <IconButton size="sm" variant="plain" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
                <ChevronLeft size={16} />
              </IconButton>
              <IconButton size="sm" variant="plain" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">
                <ChevronRight size={16} />
              </IconButton>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
            {WEEKDAYS.map((day) => (
              <div key={day} className="bg-surface-secondary px-2 py-1.5 text-center">
                <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                  {day}
                </Typography>
              </div>
            ))}
            {cells.map((day, i) => {
              const dayEntries = day ? sortedEntries.filter((entry) => sameDay(entry.startAt, new Date(year, month, day))) : [];
              return (
                <div
                  key={i}
                  className="flex min-h-[92px] flex-col gap-1 bg-surface p-1.5"
                  onClick={() => day && openCreate(day)}
                  role={day ? "button" : undefined}
                  style={day ? { cursor: "pointer" } : undefined}
                >
                  {day ? (
                    <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                      {day}
                    </Typography>
                  ) : null}
                  {dayEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(entry);
                      }}
                      className="truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium"
                      style={{
                        backgroundColor: entry.landGroup === "red" ? "var(--color-red-land-light)" : "var(--color-blue-land-light)",
                        color: entry.landGroup === "red" ? "var(--color-red-land)" : "var(--color-blue-land)",
                      }}
                    >
                      {entry.activityName} · {entry.room}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      ) : sortedEntries.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No lessons scheduled yet"
            description="Add the first lesson for this course."
            action={
              <Button size="sm" color="primary" onClick={() => openCreate(null)}>
                Add Lesson
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Activity</th>
                <th>Land Group</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => (
                <tr key={entry.id} onClick={() => openEdit(entry)} style={{ cursor: "pointer" }}>
                  <td>{formatDate(entry.startAt)}</td>
                  <td>
                    {new Date(entry.startAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} –{" "}
                    {new Date(entry.endAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>{entry.activityName}</td>
                  <td>
                    <LandGroupChip landGroup={entry.landGroup} />
                  </td>
                  <td>{entry.room}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {formOpen ? (
        <LessonFormModal
          key={editingEntry?.id ?? "new"}
          open
          onClose={() => setFormOpen(false)}
          entry={editingEntry}
          defaultDate={defaultDate}
        />
      ) : null}
    </div>
  );
}
