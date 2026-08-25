import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { StatusChip } from "@/components/common/StatusChip";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssignments, selectAssignments } from "@/features/activities/assignmentsSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import { fetchSubmissions, selectSubmissions } from "@/features/assessments/submissionsSlice";
import { fetchMarks, selectMarks } from "@/features/assessments/marksSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { countdownLabel } from "@/lib/utils";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)", cursor: "pointer" },
};

export function DsAssessmentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const course = useAppSelector(selectActiveCourse);
  const activities = useAppSelector(selectActivities);
  const assignments = useAppSelector(selectAssignments);
  const schedules = useAppSelector(selectAssessmentSchedules);
  const submissions = useAppSelector(selectSubmissions);
  const marks = useAppSelector(selectMarks);

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssignments(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
      dispatch(fetchSubmissions(course.id));
      dispatch(fetchMarks(course.id));
    }
  }, [dispatch, course]);

  if (!course) {
    return (
      <Card>
        <EmptyState icon={ClipboardCheck} title="No active course" description="You are not assigned to an active course." />
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress size="md" />
      </div>
    );
  }

  const rows = assignments
    .map((assignment) => {
      const activity = activities.find((a) => a.id === assignment.activityId);
      const schedule = schedules.find((s) => s.activityId === assignment.activityId);
      const pendingCount = schedule
        ? submissions.filter((s) => s.assessmentId === schedule.id && !marks.some((m) => m.assessmentId === schedule.id && m.officerId === s.officerId && m.isComplete)).length
        : 0;
      return { assignment, activity, schedule, pendingCount };
    })
    .filter((row) => row.activity);

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Assessments &amp; Marking
      </Typography>

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title="No activities assigned yet" description="Admin has not assigned you to any activity yet." />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Land Group</th>
                <th>Deadline</th>
                <th>Pending Marking</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ assignment, activity, schedule, pendingCount }) => (
                <tr
                  key={assignment.id}
                  onClick={() => schedule && navigate(`/ds/assessments/${schedule.id}/marking`)}
                  title={schedule ? undefined : "No assessment scheduled yet"}
                >
                  <td>{activity!.name}</td>
                  <td>
                    <LandGroupChip landGroup={assignment.landGroup} />
                  </td>
                  <td>{schedule ? countdownLabel(schedule.deadline) : "Not scheduled"}</td>
                  <td>
                    {pendingCount > 0 ? <StatusChip label={`${pendingCount} pending`} tone="warning" /> : <StatusChip label="Up to date" tone="success" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
