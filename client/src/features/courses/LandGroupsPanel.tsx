import { useEffect } from "react";
import { Users } from "lucide-react";
import Avatar from "@mui/joy/Avatar";
import CircularProgress from "@mui/joy/CircularProgress";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { fetchOfficers, selectOfficers, selectOfficersStatus } from "@/features/personnel/officersSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { initials } from "@/lib/utils";
import type { LandGroupName } from "@/types";

const GROUPS: { name: LandGroupName; label: string }[] = [
  { name: "red", label: "Red Land" },
  { name: "blue", label: "Blue Land" },
];

type Props = {
  // Fixed when rendered inside a course's own Land Groups tab; falls back to
  // the topbar-selected course on the global /admin/land-groups page. Never
  // a CRUD screen — Land Groups are only ever auto-created with the course.
  courseId?: string;
};

export function LandGroupsPanel({ courseId: courseIdProp }: Props = {}) {
  const dispatch = useAppDispatch();
  const topbarCourseId = useSelectedCourseId();
  const courseId = courseIdProp ?? topbarCourseId;
  const officers = useAppSelector(selectOfficers);
  const status = useAppSelector(selectOfficersStatus);

  useEffect(() => {
    if (courseId) dispatch(fetchOfficers(courseId));
  }, [dispatch, courseId]);

  if (!courseId) {
    return (
      <Card>
        <EmptyState icon={Users} title="Select a course" description="Choose a course from the topbar to view its land groups." />
      </Card>
    );
  }

  if (status === "loading" && officers.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress size="md" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {GROUPS.map((group) => {
        const roster = officers.filter((officer) => officer.landGroup === group.name);
        return (
          <Card key={group.name} title={`${group.label} (${roster.length})`}>
            {roster.length === 0 ? (
              <EmptyState icon={Users} title="No officers in this land group yet" />
            ) : (
              <div className="flex flex-col">
                {roster.map((officer) => (
                  <div key={officer.id} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
                    <Avatar size="sm">{initials(officer.user.fullName)}</Avatar>
                    <div className="flex flex-col">
                      <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                        {officer.user.rank} {officer.user.fullName}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {officer.user.armyNumber}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
