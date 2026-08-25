import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { toast } from "react-toastify";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import DialogActions from "@mui/joy/DialogActions";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import IconButton from "@mui/joy/IconButton";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Tab from "@mui/joy/Tab";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Tabs from "@mui/joy/Tabs";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { StatCard } from "@/components/common/StatCard";
import { StatusChip, type StatusTone } from "@/components/common/StatusChip";
import { LandGroupsPanel } from "@/features/courses/LandGroupsPanel";
import { OfficersPage } from "@/features/personnel/OfficersPage";
import { DirectingStaffPage } from "@/features/personnel/DirectingStaffPage";
import { ActivitiesPage } from "@/features/activities/ActivitiesPage";
import { archiveCourse, fetchCourses, markCourseCompleted, selectCourseById, selectCoursesStatus } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { CourseStatus } from "@/types";

const statusTone: Record<CourseStatus, StatusTone> = { active: "success", completed: "info", archived: "warning" };
const statusLabel: Record<CourseStatus, string> = { active: "Active", completed: "Completed", archived: "Archived" };

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectCourseById(courseId));
  const coursesStatus = useAppSelector(selectCoursesStatus);
  const [completing, setCompleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (coursesStatus === "idle") dispatch(fetchCourses());
  }, [dispatch, coursesStatus]);

  async function handleMarkCompleted() {
    if (!course) return;
    setCompleting(true);
    try {
      await dispatch(markCourseCompleted(course.id)).unwrap();
      toast.success(`${course.code} marked completed — it can now be archived.`);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not mark course completed.");
    } finally {
      setCompleting(false);
    }
  }

  async function handleArchive() {
    if (!course) return;
    setArchiving(true);
    try {
      await dispatch(archiveCourse(course.id)).unwrap();
      toast.success(`${course.code} archived — it is now read-only.`);
      setConfirmArchive(false);
      navigate(`/admin/archive/${course.id}`);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not archive course.");
    } finally {
      setArchiving(false);
    }
  }

  if (!course) {
    return (
      <div className="flex justify-center py-16">
        {coursesStatus === "loading" ? <CircularProgress size="md" /> : <Typography sx={{ color: "var(--color-text-muted)" }}>Course not found.</Typography>}
      </div>
    );
  }

  // An archived course only ever renders as the dedicated read-only view —
  // never this interactive one, even via a direct/stale URL. See
  // ArchivedCourseDetailPage's note on ui-rules.md's Archive invariant.
  if (course.status === "archived") {
    return <Navigate to={`/admin/archive/${course.id}`} replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconButton variant="plain" color="neutral" size="sm" onClick={() => navigate("/admin/courses")} aria-label="Back to Courses">
          <ArrowLeft size={18} />
        </IconButton>
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          {course.code}
        </Typography>
        <StatusChip label={statusLabel[course.status]} tone={statusTone[course.status]} />
      </div>

      <Tabs defaultValue="overview">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="land-groups">Land Groups</Tab>
          <Tab value="officers">Officers</Tab>
          <Tab value="directing-staff">Directing Staff</Tab>
          <Tab value="activities">Activities</Tab>
        </TabList>

        <TabPanel value="overview" sx={{ px: 0, py: 3 }}>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={Users} value={course.officerCount} label="Officers" color="primary" />
              <StatCard icon={ShieldCheck} value={course.directingStaffCount} label="Directing Staff" color="info" />
              <StatCard icon={TrendingUp} value={`${course.progressPercent}%`} label="Course Progress" color="success" />
            </div>
            <Card title="Course Details">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>Start Year</Typography>
                  <Typography level="body-sm" sx={{ color: "var(--color-text-primary)" }}>{course.startYear}</Typography>
                </div>
                <div className="flex justify-between">
                  <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>Land Groups</Typography>
                  <Typography level="body-sm" sx={{ color: "var(--color-text-primary)" }}>
                    {course.landGroups.length ? "Red Land, Blue Land" : "—"}
                  </Typography>
                </div>
              </div>
            </Card>
            <Card title="Course Lifecycle">
              <div className="flex items-center justify-between gap-3">
                <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                  {course.status === "active"
                    ? "Mark this course completed once all activities are finished, then archive it."
                    : "This course is completed — archive it to make every record read-only."}
                </Typography>
                {course.status === "active" ? (
                  <Button variant="outlined" color="neutral" loading={completing} onClick={handleMarkCompleted}>
                    Mark Completed
                  </Button>
                ) : (
                  <Button color="warning" onClick={() => setConfirmArchive(true)}>
                    Archive Course
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="land-groups" sx={{ px: 0, py: 3 }}>
          <LandGroupsPanel courseId={course.id} />
        </TabPanel>

        <TabPanel value="officers" sx={{ px: 0, py: 3 }}>
          <OfficersPage courseId={course.id} />
        </TabPanel>

        <TabPanel value="directing-staff" sx={{ px: 0, py: 3 }}>
          <DirectingStaffPage courseId={course.id} />
        </TabPanel>

        <TabPanel value="activities" sx={{ px: 0, py: 3 }}>
          <ActivitiesPage courseId={course.id} />
        </TabPanel>
      </Tabs>

      <Modal open={confirmArchive} onClose={() => setConfirmArchive(false)}>
        <ModalDialog role="alertdialog">
          <DialogTitle>Archive {course.code}?</DialogTitle>
          <DialogContent>
            This locks every record on the course as read-only. Only allowed once every officer has completed every mandatory activity.
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="neutral" onClick={() => setConfirmArchive(false)} disabled={archiving}>
              Cancel
            </Button>
            <Button color="warning" loading={archiving} onClick={handleArchive}>
              Archive
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </div>
  );
}
