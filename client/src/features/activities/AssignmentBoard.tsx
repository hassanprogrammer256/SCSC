import { useEffect } from "react";
import { toast } from "react-toastify";
import { UsersRound } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { fetchActivities, selectActivities, selectActivitiesStatus } from "@/features/activities/activitiesSlice";
import { fetchAssignments, removeAssignment, selectAssignments, upsertAssignment } from "@/features/activities/assignmentsSlice";
import { fetchDirectingStaff, selectDirectingStaff } from "@/features/personnel/directingStaffSlice";
import { selectCourseById } from "@/features/courses/coursesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { LandGroupName } from "@/types";

// Fixed column order for the board — Red Land always left of Blue Land,
// matching every other Land Group display in the app.
const LAND_GROUP_ORDER: LandGroupName[] = ["red", "blue"];
const UNASSIGNED = "unassigned";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
};

// Standalone /admin/assignments page only — never nested in a course tab
// (see build-plan.md Phase 3 /architect decision log), so it always reads
// the topbar-selected course rather than taking a courseId prop.
export function AssignmentBoard() {
  const dispatch = useAppDispatch();
  const courseId = useSelectedCourseId();
  const course = useAppSelector(selectCourseById(courseId ?? undefined));
  const activities = useAppSelector(selectActivities);
  const activitiesStatus = useAppSelector(selectActivitiesStatus);
  const assignments = useAppSelector(selectAssignments);
  const directingStaff = useAppSelector(selectDirectingStaff);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchActivities(courseId));
      dispatch(fetchAssignments(courseId));
      dispatch(fetchDirectingStaff(courseId));
    }
  }, [dispatch, courseId]);

  const landGroups = LAND_GROUP_ORDER.map((name) => course?.landGroups.find((group) => group.name === name)).filter(
    (group): group is NonNullable<typeof group> => Boolean(group),
  );

  async function handleChange(
    activityId: string,
    landGroupId: string,
    existingAssignmentId: string | undefined,
    value: string,
  ) {
    if (!courseId) return;
    try {
      if (value === UNASSIGNED) {
        if (existingAssignmentId) {
          await dispatch(removeAssignment({ courseId, assignmentId: existingAssignmentId })).unwrap();
        }
      } else {
        await dispatch(
          upsertAssignment({ courseId, activityId, landGroupId, directingStaffId: value, existingAssignmentId }),
        ).unwrap();
      }
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not update assignment.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Assignments
      </Typography>

      {!courseId ? (
        <Card>
          <EmptyState icon={UsersRound} title="Select a course" description="Choose a course from the topbar to view its assignment board." />
        </Card>
      ) : activitiesStatus === "loading" && activities.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <EmptyState
            icon={UsersRound}
            title="No activities defined yet"
            description="Add activities for this course before assigning Directing Staff."
          />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Activity</th>
                {landGroups.map((group) => (
                  <th key={group.id}>{group.name === "red" ? "Red Land" : "Blue Land"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.name}</td>
                  {landGroups.map((group, index) => {
                    const otherGroup = landGroups[1 - index];
                    const cellAssignment = assignments.find((a) => a.activityId === activity.id && a.landGroup === group.name);
                    const conflictingDsId = otherGroup
                      ? assignments.find((a) => a.activityId === activity.id && a.landGroup === otherGroup.name)?.directingStaffId
                      : undefined;
                    const options = directingStaff.filter((ds) => ds.id !== conflictingDsId);

                    return (
                      <td key={group.id}>
                        <Select
                          size="sm"
                          value={cellAssignment?.directingStaffId ?? UNASSIGNED}
                          onChange={(_, value) => value && handleChange(activity.id, group.id, cellAssignment?.id, value)}
                          sx={{ minWidth: "180px" }}
                        >
                          <Option value={UNASSIGNED}>— Unassigned —</Option>
                          {options.map((ds) => (
                            <Option key={ds.id} value={ds.id}>
                              {ds.user.rank} {ds.user.fullName}
                            </Option>
                          ))}
                        </Select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
