import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip } from "@/components/common/StatusChip";
import { AssessmentFormModal } from "@/features/assessments/AssessmentFormModal";
import {
  fetchAssessmentSchedules,
  selectAssessmentSchedules,
  selectAssessmentSchedulesStatus,
} from "@/features/assessments/assessmentsSlice";
import { fetchActivities, selectActivities, selectActivitiesStatus } from "@/features/activities/activitiesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { countdownLabel, formatDateTime } from "@/lib/utils";
import type { Activity } from "@/types";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

// Admin-only, standalone /admin/assessments (no CourseDetailPage tab — none
// reserved for it, same as Assignments). Sets the deadline that gates both
// Submission and Mark creation in Phase 5 — instructions/guide content is
// captured here too since AssessmentSchedule is a single 1:1 record per
// Activity, per build-plan.md Phase 4.
export function AssessmentsPage() {
  const dispatch = useAppDispatch();
  const courseId = useSelectedCourseId();
  const activities = useAppSelector(selectActivities);
  const activitiesStatus = useAppSelector(selectActivitiesStatus);
  const schedules = useAppSelector(selectAssessmentSchedules);
  const schedulesStatus = useAppSelector(selectAssessmentSchedulesStatus);

  const [formActivity, setFormActivity] = useState<Activity | null>(null);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchActivities(courseId));
      dispatch(fetchAssessmentSchedules(courseId));
    }
  }, [dispatch, courseId]);

  const loading = (activitiesStatus === "loading" || schedulesStatus === "loading") && activities.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Assessments
      </Typography>

      {!courseId ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title="Select a course" description="Choose a course from the topbar to view its assessments." />
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title="No activities defined yet" description="Add activities for this course before scheduling assessments." />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Deadline</th>
                <th>Status</th>
                <th style={{ width: "140px" }} />
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => {
                const schedule = schedules.find((s) => s.activityId === activity.id) ?? null;
                const deadlineLabel = schedule ? countdownLabel(schedule.deadline) : null;
                const overdue = deadlineLabel === "Overdue";
                return (
                  <tr key={activity.id}>
                    <td>{activity.name}</td>
                    <td>{schedule ? formatDateTime(schedule.deadline) : "—"}</td>
                    <td>
                      {schedule ? (
                        <StatusChip tone={overdue ? "error" : "success"} label={overdue ? "Deadline passed" : (deadlineLabel ?? "")} />
                      ) : (
                        <StatusChip tone="warning" label="Not scheduled" />
                      )}
                    </td>
                    <td>
                      <Button size="sm" variant="outlined" color="neutral" onClick={() => setFormActivity(activity)}>
                        {schedule ? "Edit" : "Schedule"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {formActivity ? (
        <AssessmentFormModal
          key={formActivity.id}
          open
          onClose={() => setFormActivity(null)}
          activity={formActivity}
          schedule={schedules.find((s) => s.activityId === formActivity.id) ?? null}
        />
      ) : null}
    </div>
  );
}
