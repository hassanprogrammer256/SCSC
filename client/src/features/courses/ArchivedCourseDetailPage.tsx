import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, ShieldCheck, Users } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import IconButton from "@mui/joy/IconButton";
import Table from "@mui/joy/Table";
import Tab from "@mui/joy/Tab";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Tabs from "@mui/joy/Tabs";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { StatCard } from "@/components/common/StatCard";
import { StatusChip } from "@/components/common/StatusChip";
import { GradeChip } from "@/components/common/GradeChip";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { fetchCourses, selectCourseById } from "@/features/courses/coursesSlice";
import { fetchOfficers, selectOfficers } from "@/features/personnel/officersSlice";
import { fetchDirectingStaff, selectDirectingStaff } from "@/features/personnel/directingStaffSlice";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssignments, selectAssignments } from "@/features/activities/assignmentsSlice";
import { fetchProgressReport, selectProgressReport } from "@/features/reports/reportsSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
};

// Read-only — this page renders NO create/edit/delete control anywhere,
// deliberately built as its own component rather than reusing the live
// CourseDetailPage's interactive tabs, per ui-rules.md's Archive invariant
// ("no edit/delete controls rendered at all, not just disabled").
export function ArchivedCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectCourseById(courseId));
  const officers = useAppSelector(selectOfficers);
  const directingStaff = useAppSelector(selectDirectingStaff);
  const activities = useAppSelector(selectActivities);
  const assignments = useAppSelector(selectAssignments);
  const progressRows = useAppSelector(selectProgressReport);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchOfficers(courseId));
      dispatch(fetchDirectingStaff(courseId));
      dispatch(fetchActivities(courseId));
      dispatch(fetchAssignments(courseId));
      dispatch(fetchProgressReport(courseId));
    }
  }, [dispatch, courseId]);

  if (!course) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconButton variant="plain" color="neutral" size="sm" onClick={() => navigate("/admin/archive")} aria-label="Back to Archive">
          <ArrowLeft size={18} />
        </IconButton>
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          {course.code}
        </Typography>
        <StatusChip label="Archived — Read Only" tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} value={course.officerCount} label="Officers" color="primary" />
        <StatCard icon={ShieldCheck} value={course.directingStaffCount} label="Directing Staff" color="info" />
        <StatCard icon={ClipboardList} value={activities.length} label="Activities" color="accent" />
      </div>

      <Tabs defaultValue="officers">
        <TabList>
          <Tab value="officers">Officers</Tab>
          <Tab value="directing-staff">Directing Staff</Tab>
          <Tab value="activities">Activities & Assignments</Tab>
          <Tab value="progress">Final Progress</Tab>
        </TabList>

        <TabPanel value="officers" sx={{ px: 0, py: 3 }}>
          <Card>
            <Table sx={tableSx}>
              <thead>
                <tr>
                  <th>Army Number</th>
                  <th>Name</th>
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
                    <td>
                      <LandGroupChip landGroup={o.landGroup} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </TabPanel>

        <TabPanel value="directing-staff" sx={{ px: 0, py: 3 }}>
          <Card>
            <Table sx={tableSx}>
              <thead>
                <tr>
                  <th>Army Number</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {directingStaff.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{d.user.armyNumber}</td>
                    <td>
                      {d.user.rank} {d.user.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </TabPanel>

        <TabPanel value="activities" sx={{ px: 0, py: 3 }}>
          <Card>
            <Table sx={tableSx}>
              <thead>
                <tr>
                  <th>Activity</th>
                  <th style={{ textAlign: "right" }}>Weight</th>
                  <th>Red Land DS</th>
                  <th>Blue Land DS</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const red = assignments.find((a) => a.activityId === activity.id && a.landGroup === "red");
                  const blue = assignments.find((a) => a.activityId === activity.id && a.landGroup === "blue");
                  const dsName = (id?: string) => directingStaff.find((d) => d.id === id)?.user.fullName ?? "—";
                  return (
                    <tr key={activity.id}>
                      <td>{activity.name}</td>
                      <td style={{ textAlign: "right" }}>{activity.weightPercent}%</td>
                      <td>{dsName(red?.directingStaffId)}</td>
                      <td>{dsName(blue?.directingStaffId)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </TabPanel>

        <TabPanel value="progress" sx={{ px: 0, py: 3 }}>
          <Card>
            <Table sx={tableSx}>
              <thead>
                <tr>
                  <th>Army Number</th>
                  <th>Name</th>
                  <th>Land Group</th>
                  <th style={{ textAlign: "right" }}>Weighted Average</th>
                  <th>Final Degree Class</th>
                </tr>
              </thead>
              <tbody>
                {progressRows.map((row) => (
                  <tr key={row.officerId}>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{row.armyNumber}</td>
                    <td>{row.fullName}</td>
                    <td>
                      <LandGroupChip landGroup={row.landGroup} />
                    </td>
                    <td style={{ textAlign: "right" }}>{row.weightedAverage !== null ? `${row.weightedAverage.toFixed(0)}%` : "—"}</td>
                    <td>{row.degreeClass ? <GradeChip band={row.degreeClass} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}
