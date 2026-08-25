import { useEffect } from "react";
import { Users } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { fetchOfficers, selectOfficers, selectOfficersStatus } from "@/features/personnel/officersSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

// /ds/officers — read-only roster of the officers in the Land Group(s) this
// DS actually teaches (server already scopes OfficerViewSet's queryset to
// that for a directing_staff requester — see personnel/views.py Phase 5).
export function DsOfficersPage() {
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const officers = useAppSelector(selectOfficers);
  const status = useAppSelector(selectOfficersStatus);

  useEffect(() => {
    if (course) dispatch(fetchOfficers(course.id));
  }, [dispatch, course]);

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        My Officers
      </Typography>

      {!course ? (
        <Card>
          <EmptyState icon={Users} title="No active course" description="You are not assigned to an active course." />
        </Card>
      ) : status === "loading" && officers.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : officers.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No officers yet" description="Officers appear here once you're assigned to teach an activity in their Land Group." />
        </Card>
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
              {officers.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{o.user.armyNumber}</td>
                  <td>
                    {o.user.rank} {o.user.fullName}
                  </td>
                  <td>{o.user.country}</td>
                  <td>
                    <LandGroupChip landGroup={o.landGroup} />
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
