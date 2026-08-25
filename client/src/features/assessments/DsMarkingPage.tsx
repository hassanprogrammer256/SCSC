import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { MarkingRow } from "@/features/assessments/MarkingRow";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssignments, selectAssignments } from "@/features/activities/assignmentsSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import { fetchSubmissions, selectSubmissions } from "@/features/assessments/submissionsSlice";
import { fetchMarks, selectMarks } from "@/features/assessments/marksSlice";
import { fetchOfficers, selectOfficers } from "@/features/personnel/officersSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { countdownLabel, formatDateTime } from "@/lib/utils";

export function DsMarkingPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const activities = useAppSelector(selectActivities);
  const assignments = useAppSelector(selectAssignments);
  const schedules = useAppSelector(selectAssessmentSchedules);
  const submissions = useAppSelector(selectSubmissions);
  const marks = useAppSelector(selectMarks);
  const officers = useAppSelector(selectOfficers);

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssignments(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
      dispatch(fetchSubmissions(course.id));
      dispatch(fetchMarks(course.id));
      dispatch(fetchOfficers(course.id));
    }
  }, [dispatch, course]);

  const schedule = schedules.find((s) => s.id === assessmentId);
  const activity = schedule ? activities.find((a) => a.id === schedule.activityId) : undefined;
  const assignment = activity ? assignments.find((a) => a.activityId === activity.id) : undefined;
  const roster = assignment ? officers.filter((o) => o.landGroup === assignment.landGroup) : [];

  if (!course || !schedule || !activity) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconButton variant="plain" color="neutral" size="sm" onClick={() => navigate("/ds/assessments")} aria-label="Back">
          <ArrowLeft size={18} />
        </IconButton>
        <div>
          <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
            {activity.name} — Marking
          </Typography>
          <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
            Deadline {formatDateTime(schedule.deadline)} — {countdownLabel(schedule.deadline)}
          </Typography>
        </div>
      </div>

      {roster.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No officers in your assigned Land Group yet" />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col">
            {roster.map((officer) => (
              <MarkingRow
                key={officer.id}
                courseId={course.id}
                assessmentId={schedule.id}
                officer={officer}
                submission={submissions.find((s) => s.assessmentId === schedule.id && s.officerId === officer.id) ?? null}
                mark={marks.find((m) => m.assessmentId === schedule.id && m.officerId === officer.id) ?? null}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
