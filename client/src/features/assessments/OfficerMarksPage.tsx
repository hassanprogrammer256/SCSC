import { useEffect } from "react";
import { Award } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { GradeChip } from "@/components/common/GradeChip";
import { StatusChip } from "@/components/common/StatusChip";
import { fetchMarks, selectMarks, selectMarksStatus } from "@/features/assessments/marksSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
};

// /officer/marks — every mark released to this officer, across all
// activities (marksSlice already scoped server-side to their own marks).
export function OfficerMarksPage() {
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const marks = useAppSelector(selectMarks);
  const status = useAppSelector(selectMarksStatus);

  useEffect(() => {
    if (course) dispatch(fetchMarks(course.id));
  }, [dispatch, course]);

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Marks &amp; Remarks
      </Typography>

      {status === "loading" && marks.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : marks.length === 0 ? (
        <Card>
          <EmptyState icon={Award} title="No marks yet" description="Marks appear here once a Directing Staff has marked your submission." />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Activity</th>
                <th style={{ textAlign: "right" }}>Score</th>
                <th>Grade</th>
                <th>Completion</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => (
                <tr key={m.id}>
                  <td>{m.activityName}</td>
                  <td style={{ textAlign: "right" }}>{m.score}%</td>
                  <td>
                    <GradeChip band={m.grade} />
                  </td>
                  <td>
                    <StatusChip label={m.isComplete ? "Approved" : "Pending Approval"} tone={m.isComplete ? "success" : "warning"} />
                  </td>
                  <td>{m.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
