import { useEffect } from "react";
import { FileText } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip } from "@/components/common/StatusChip";
import { fetchSubmissions, selectSubmissions, selectSubmissionsStatus } from "@/features/assessments/submissionsSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { formatDateTime } from "@/lib/utils";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
};

// /officer/submissions — history across every activity (submissionsSlice is
// already scoped server-side to the officer's own submissions only). Detail
// per-activity submission still happens on OfficerActivityDetailPage; this
// is the cross-activity summary view.
export function OfficerSubmissionsPage() {
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const submissions = useAppSelector(selectSubmissions);
  const status = useAppSelector(selectSubmissionsStatus);

  useEffect(() => {
    if (course) dispatch(fetchSubmissions(course.id));
  }, [dispatch, course]);

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Submissions
      </Typography>

      {status === "loading" && submissions.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No submissions yet" description="Your uploaded assessment files will appear here." />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Activity</th>
                <th>File Type</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td>{s.activityName}</td>
                  <td style={{ textTransform: "uppercase" }}>{s.fileType}</td>
                  <td>{formatDateTime(s.submittedAt)}</td>
                  <td>
                    <StatusChip label={s.isLate ? "Late" : "On Time"} tone={s.isLate ? "warning" : "success"} />
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
