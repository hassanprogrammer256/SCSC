import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, FileCheck2, Upload } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { GradeChip } from "@/components/common/GradeChip";
import { StatusChip } from "@/components/common/StatusChip";
import { selectActivityById, fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssessmentSchedules, selectAssessmentScheduleForActivity } from "@/features/assessments/assessmentsSlice";
import { fetchSubmissions, selectSubmissions, submitAssessmentFile, selectUploadStatus } from "@/features/assessments/submissionsSlice";
import { fetchMarks, selectMarks } from "@/features/assessments/marksSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { countdownLabel, formatDateTime } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".docx", ".pdf"];

export function OfficerActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const activity = useAppSelector(selectActivityById(activityId));
  const activities = useAppSelector(selectActivities);
  const schedule = useAppSelector(selectAssessmentScheduleForActivity(activityId ?? ""));
  const submissions = useAppSelector(selectSubmissions);
  const marks = useAppSelector(selectMarks);
  const uploadStatus = useAppSelector(selectUploadStatus);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      if (activities.length === 0) dispatch(fetchActivities(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
      dispatch(fetchSubmissions(course.id));
      dispatch(fetchMarks(course.id));
    }
  }, [dispatch, course, activities.length]);

  const submission = schedule ? submissions.find((s) => s.assessmentId === schedule.id) : undefined;
  const mark = schedule ? marks.find((m) => m.assessmentId === schedule.id) : undefined;
  const deadlinePassed = schedule ? countdownLabel(schedule.deadline) === "Overdue" : false;

  function validateAndUpload(file: File) {
    setFileError(null);
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setFileError("Only .docx and .pdf files are accepted.");
      return;
    }
    if (!course || !schedule) return;
    dispatch(submitAssessmentFile({ courseId: course.id, assessmentId: schedule.id, file }))
      .unwrap()
      .then(() => toast.success("Submission uploaded — screening for plagiarism now runs automatically."))
      .catch((error) => toast.error(typeof error === "string" ? error : "Could not submit file."));
  }

  if (!activity) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconButton variant="plain" color="neutral" size="sm" onClick={() => navigate("/officer/activities")} aria-label="Back">
          <ArrowLeft size={18} />
        </IconButton>
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
          {activity.name}
        </Typography>
      </div>

      <Card title="Assessment Guide">
        <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
          {schedule?.instructions || "No instructions provided yet."}
        </Typography>
        <Typography level="body-xs" sx={{ color: "var(--color-text-muted)", mt: 1 }}>
          {schedule ? `Deadline: ${formatDateTime(schedule.deadline)} — ${countdownLabel(schedule.deadline)}` : "No deadline scheduled yet."}
        </Typography>
      </Card>

      <Card title="Your Submission">
        {submission ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-success" />
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)" }}>
                Submitted {formatDateTime(submission.submittedAt)} ({submission.fileType.toUpperCase()})
              </Typography>
            </div>
            <StatusChip label={submission.isLate ? "Submitted Late" : "Submitted On Time"} tone={submission.isLate ? "warning" : "success"} />
          </div>
        ) : deadlinePassed ? (
          <StatusChip label="Deadline passed — submission window closed" tone="error" />
        ) : !schedule ? (
          <Typography level="body-sm" sx={{ color: "var(--color-text-muted)" }}>
            No assessment has been scheduled for this activity yet.
          </Typography>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) validateAndUpload(file);
              }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center"
              style={{ borderColor: dragOver ? "var(--color-primary)" : "var(--color-border)" }}
            >
              <Upload size={28} className="text-text-muted" />
              <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                Drag a file here, or click to browse
              </Typography>
              <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                Accepted: .docx, .pdf only
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) validateAndUpload(file);
                  e.target.value = "";
                }}
              />
            </div>
            {fileError ? (
              <Typography level="body-xs" sx={{ color: "var(--color-error)" }}>
                {fileError}
              </Typography>
            ) : null}
            {uploadStatus === "loading" ? (
              <div className="flex items-center gap-2">
                <CircularProgress size="sm" />
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  Uploading…
                </Typography>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {mark ? (
        <Card title="Marks & Remarks">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                Score: {mark.score}%
              </Typography>
              <GradeChip band={mark.grade} />
              {mark.isComplete ? <StatusChip label="Approved" tone="success" /> : <StatusChip label="Pending Approval" tone="warning" />}
            </div>
            {mark.remarks ? (
              <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                Remarks: {mark.remarks}
              </Typography>
            ) : null}
            {mark.comments ? (
              <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                Comments: {mark.comments}
              </Typography>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
