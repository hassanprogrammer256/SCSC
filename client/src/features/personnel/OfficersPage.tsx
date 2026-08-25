import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import Avatar from "@mui/joy/Avatar";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { RegisterOfficerModal } from "@/features/personnel/RegisterOfficerModal";
import { fetchOfficers, selectOfficers, selectOfficersStatus } from "@/features/personnel/officersSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { initials } from "@/lib/utils";
import type { LandGroupName } from "@/types";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

type Props = {
  // Fixed when rendered inside a course's own Officers tab; falls back to
  // the topbar-selected course on the global /admin/officers page.
  courseId?: string;
};

export function OfficersPage({ courseId: courseIdProp }: Props = {}) {
  const dispatch = useAppDispatch();
  const topbarCourseId = useSelectedCourseId();
  const courseId = courseIdProp ?? topbarCourseId;
  const officers = useAppSelector(selectOfficers);
  const status = useAppSelector(selectOfficersStatus);
  const [view, setView] = useState<ViewMode>("grid");
  const [landGroupFilter, setLandGroupFilter] = useState<LandGroupName | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (courseId) dispatch(fetchOfficers(courseId));
  }, [dispatch, courseId]);

  const filtered = landGroupFilter === "all" ? officers : officers.filter((officer) => officer.landGroup === landGroupFilter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
          Officers
        </Typography>
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            value={landGroupFilter}
            onChange={(_, value) => value && setLandGroupFilter(value)}
            sx={{ minWidth: "150px" }}
          >
            <Option value="all">All Land Groups</Option>
            <Option value="red">Red Land</Option>
            <Option value="blue">Blue Land</Option>
          </Select>
          <ViewToggle value={view} onChange={setView} />
          <Button startDecorator={<Plus size={16} />} color="primary" onClick={() => setModalOpen(true)} disabled={!courseId}>
            Register Officer
          </Button>
        </div>
      </div>

      {!courseId ? (
        <Card>
          <EmptyState icon={Users} title="Select a course" description="Choose a course from the topbar to view its officers." />
        </Card>
      ) : status === "loading" && officers.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No officers registered yet"
            description="Register the first officer for this course."
            action={
              <Button size="sm" color="primary" onClick={() => setModalOpen(true)}>
                Register Officer
              </Button>
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((officer) => (
            <Card key={officer.id}>
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar src={officer.user.avatarUrl} size="lg">
                  {officer.user.avatarUrl ? null : initials(officer.user.fullName)}
                </Avatar>
                <div>
                  <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                    {officer.user.rank} {officer.user.fullName}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {officer.user.armyNumber}
                  </Typography>
                </div>
                <LandGroupChip landGroup={officer.landGroup} />
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
                <th>Land Group</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((officer) => (
                <tr key={officer.id}>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{officer.user.armyNumber}</td>
                  <td>
                    {officer.user.rank} {officer.user.fullName}
                  </td>
                  <td>{officer.user.country}</td>
                  <td>
                    <LandGroupChip landGroup={officer.landGroup} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <RegisterOfficerModal open={modalOpen} onClose={() => setModalOpen(false)} courseId={courseId ?? undefined} />
    </div>
  );
}
