import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { fetchActivities, selectActivities, selectActivitiesStatus } from "@/features/activities/activitiesSlice";
import { fetchAssignments, selectAssignments } from "@/features/activities/assignmentsSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { countdownLabel } from "@/lib/utils";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

// /ds/activities — read-only list of the Activities this DS is assigned to
// teach (assignmentsSlice, server-scoped to the DS's own rows). Marking
// itself happens from DsAssessmentsPage/DsMarkingPage — this page is purely
// "what am I teaching."
export function DsActivitiesPage() {
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const activities = useAppSelector(selectActivities);
  const activitiesStatus = useAppSelector(selectActivitiesStatus);
  const assignments = useAppSelector(selectAssignments);
  const schedules = useAppSelector(selectAssessmentSchedules);

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssignments(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
    }
  }, [dispatch, course]);

  const rows = assignments
    .map((assignment) => ({ assignment, activity: activities.find((a) => a.id === assignment.activityId) }))
    .filter((row): row is { assignment: (typeof assignments)[number]; activity: NonNullable<(typeof row)["activity"]> } => Boolean(row.activity));

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        My Activities
      </Typography>

      {!course ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No active course" description="You are not assigned to an active course." />
        </Card>
      ) : activitiesStatus === "loading" && rows.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No activities assigned yet" description="Admin has not assigned you to any activity yet." />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Land Group</th>
                <th style={{ textAlign: "right" }}>Weight</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ assignment, activity }) => {
                const schedule = schedules.find((s) => s.activityId === activity.id);
                return (
                  <tr key={assignment.id}>
                    <td>{activity.name}</td>
                    <td>
                      <LandGroupChip landGroup={assignment.landGroup} />
                    </td>
                    <td style={{ textAlign: "right" }}>{activity.weightPercent}%</td>
                    <td>{schedule ? countdownLabel(schedule.deadline) : "Not scheduled"}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
