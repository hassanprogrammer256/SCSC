import { useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { RegisterDirectingStaffModal } from "@/features/personnel/RegisterDirectingStaffModal";
import { fetchDirectingStaff, selectDirectingStaff, selectDirectingStaffStatus } from "@/features/personnel/directingStaffSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { initials } from "@/lib/utils";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

type Props = {
  // Fixed when rendered inside a course's own Directing Staff tab; falls
  // back to the topbar-selected course on the global page.
  courseId?: string;
};

export function DirectingStaffPage({ courseId: courseIdProp }: Props = {}) {
  const dispatch = useAppDispatch();
  const topbarCourseId = useSelectedCourseId();
  const courseId = courseIdProp ?? topbarCourseId;
  const directingStaff = useAppSelector(selectDirectingStaff);
  const status = useAppSelector(selectDirectingStaffStatus);
  const [view, setView] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (courseId) dispatch(fetchDirectingStaff(courseId));
  }, [dispatch, courseId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
          Directing Staff
        </Typography>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <Button startDecorator={<Plus size={16} />} color="primary" onClick={() => setModalOpen(true)} disabled={!courseId}>
            Register Directing Staff
          </Button>
        </div>
      </div>

      {!courseId ? (
        <Card>
          <EmptyState icon={ShieldCheck} title="Select a course" description="Choose a course from the topbar to view its directing staff." />
        </Card>
      ) : status === "loading" && directingStaff.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : directingStaff.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="No directing staff registered yet"
            description="Register the first DS for this course."
            action={
              <Button size="sm" color="primary" onClick={() => setModalOpen(true)}>
                Register Directing Staff
              </Button>
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {directingStaff.map((ds) => (
            <Card key={ds.id}>
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar src={ds.user.avatarUrl} size="lg">
                  {ds.user.avatarUrl ? null : initials(ds.user.fullName)}
                </Avatar>
                <div>
                  <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                    {ds.user.rank} {ds.user.fullName}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {ds.user.armyNumber}
                  </Typography>
                </div>
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  {ds.user.country}
                </Typography>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Army Number</th>
                <th>Name</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {directingStaff.map((ds) => (
                <tr key={ds.id}>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{ds.user.armyNumber}</td>
                  <td>
                    {ds.user.rank} {ds.user.fullName}
                  </td>
                  <td>{ds.user.country}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <RegisterDirectingStaffModal open={modalOpen} onClose={() => setModalOpen(false)} courseId={courseId ?? undefined} />
    </div>
  );
}
