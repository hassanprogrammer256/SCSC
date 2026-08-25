import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip, type StatusTone } from "@/components/common/StatusChip";
import { fetchActivities, selectActivities, selectActivitiesStatus } from "@/features/activities/activitiesSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import { fetchSubmissions, selectSubmissions } from "@/features/assessments/submissionsSlice";
import { fetchMarks, selectMarks } from "@/features/assessments/marksSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { countdownLabel } from "@/lib/utils";

export function OfficerActivitiesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const course = useAppSelector(selectActiveCourse);
  const activities = useAppSelector(selectActivities);
  const activitiesStatus = useAppSelector(selectActivitiesStatus);
  const schedules = useAppSelector(selectAssessmentSchedules);
  const submissions = useAppSelector(selectSubmissions);
  const marks = useAppSelector(selectMarks);

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
      dispatch(fetchSubmissions(course.id));
      dispatch(fetchMarks(course.id));
    }
  }, [dispatch, course]);

  function statusFor(activityId: string): { label: string; tone: StatusTone } {
    const schedule = schedules.find((s) => s.activityId === activityId);
    const mark = marks.find((m) => schedule && m.assessmentId === schedule.id);
    if (mark?.isComplete) return { label: "Marked", tone: "success" };
    const submission = submissions.find((s) => schedule && s.assessmentId === schedule.id);
    if (submission) return { label: "Submitted", tone: "info" };
    if (schedule && countdownLabel(schedule.deadline) === "Overdue") return { label: "Overdue", tone: "error" };
    return { label: "Not Submitted", tone: "warning" };
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        My Activities
      </Typography>

      {!course ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No active course" description="You are not enrolled on an active course." />
        </Card>
      ) : activitiesStatus === "loading" && activities.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No activities yet" description="Activities will appear here once Admin defines them." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => {
            const schedule = schedules.find((s) => s.activityId === activity.id);
            const status = statusFor(activity.id);
            return (
              <Card key={activity.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-3" onClick={() => navigate(`/officer/activities/${activity.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <Typography level="title-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                      {activity.name}
                    </Typography>
                    <StatusChip label={status.label} tone={status.tone} />
                  </div>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                    Weight {activity.weightPercent}%
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)" }}>
                    {schedule ? countdownLabel(schedule.deadline) : "No deadline scheduled yet"}
                  </Typography>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
