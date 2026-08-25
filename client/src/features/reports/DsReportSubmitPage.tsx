import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FileCheck2 } from "lucide-react";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Stack from "@mui/joy/Stack";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssignments, selectAssignments } from "@/features/activities/assignmentsSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import {
  fetchAssessmentReports,
  selectDsReports,
  selectSubmitReportStatus,
  submitAssessmentReport,
} from "@/features/reports/reportsSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { formatDateTime } from "@/lib/utils";

const labelSx = { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" } as const;

export function DsReportSubmitPage() {
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const activities = useAppSelector(selectActivities);
  const assignments = useAppSelector(selectAssignments);
  const schedules = useAppSelector(selectAssessmentSchedules);
  const reports = useAppSelector(selectDsReports);
  const submitStatus = useAppSelector(selectSubmitReportStatus);

  const [assessmentId, setAssessmentId] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssignments(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
      dispatch(fetchAssessmentReports(course.id));
    }
  }, [dispatch, course]);

  const myScheduledActivities = schedules
    .filter((s) => assignments.some((a) => a.activityId === s.activityId))
    .map((s) => ({ schedule: s, activity: activities.find((a) => a.id === s.activityId) }))
    .filter((row): row is { schedule: (typeof schedules)[number]; activity: NonNullable<(typeof row)["activity"]> } => Boolean(row.activity));

  async function handleSubmit() {
    if (!course || !assessmentId || !body.trim()) return;
    try {
      await dispatch(submitAssessmentReport({ courseId: course.id, assessmentId, body })).unwrap();
      toast.success("Report submitted to Admin.");
      setAssessmentId("");
      setBody("");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not submit report.");
    }
  }

  if (!course) {
    return (
      <Card>
        <EmptyState icon={FileCheck2} title="No active course" description="You are not assigned to an active course." />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Submit Report
      </Typography>

      <Card title="New Assessment Report">
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel sx={labelSx}>Activity</FormLabel>
            <Select placeholder="Select Activity" value={assessmentId || null} onChange={(_, v) => v && setAssessmentId(v)}>
              {myScheduledActivities.map(({ schedule, activity }) => (
                <Option key={schedule.id} value={schedule.id}>
                  {activity.name}
                </Option>
              ))}
            </Select>
          </FormControl>
          <FormControl required>
            <FormLabel sx={labelSx}>Report</FormLabel>
            <Textarea minRows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Summarize marking outcomes, notable issues, and recommendations…" />
          </FormControl>
          <Button color="primary" loading={submitStatus === "loading"} disabled={!assessmentId || !body.trim()} onClick={handleSubmit}>
            Submit Report
          </Button>
        </Stack>
      </Card>

      <Typography level="title-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
        Previously Submitted
      </Typography>
      {submitStatus === "loading" && reports.length === 0 ? (
        <div className="flex justify-center py-8">
          <CircularProgress size="sm" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <EmptyState icon={FileCheck2} title="No reports submitted yet" />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <Card key={report.id} title={report.activityName}>
              <div className="flex flex-col gap-2">
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  {formatDateTime(report.submittedAt)}
                </Typography>
                <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                  {report.body}
                </Typography>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
