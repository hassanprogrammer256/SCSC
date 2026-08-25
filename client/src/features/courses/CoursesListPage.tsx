import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, ShieldCheck, Users } from "lucide-react";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import LinearProgress from "@mui/joy/LinearProgress";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip, type StatusTone } from "@/components/common/StatusChip";
import { CreateCourseModal } from "@/features/courses/CreateCourseModal";
import { fetchCourses, selectCourses, selectCoursesStatus } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { CourseStatus } from "@/types";

const statusTone: Record<CourseStatus, StatusTone> = { active: "success", completed: "info", archived: "warning" };
const statusLabel: Record<CourseStatus, string> = { active: "Active", completed: "Completed", archived: "Archived" };

export function CoursesListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const courses = useAppSelector(selectCourses);
  const status = useAppSelector(selectCoursesStatus);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
          Courses
        </Typography>
        <Button startDecorator={<Plus size={16} />} color="primary" onClick={() => setModalOpen(true)}>
          Create Course
        </Button>
      </div>

      {status === "loading" && courses.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            description="Create the first course to start registering officers and directing staff."
            action={
              <Button size="sm" color="primary" onClick={() => setModalOpen(true)}>
                Create Course
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="cursor-pointer transition-shadow hover:shadow-md" >
              <div className="flex flex-col gap-4" onClick={() => navigate(`/admin/courses/${course.id}`)}>
                <div className="flex items-start justify-between">
                  <Typography sx={{ color: "var(--color-text-primary)", fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {course.code}
                  </Typography>
                  <StatusChip label={statusLabel[course.status]} tone={statusTone[course.status]} />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-text-muted" />
                    <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                      {course.officerCount} Officers
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-text-muted" />
                    <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                      {course.directingStaffCount} DS
                    </Typography>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                      Progress
                    </Typography>
                    <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      {course.progressPercent}%
                    </Typography>
                  </div>
                  <LinearProgress determinate value={course.progressPercent} sx={{ "--LinearProgress-radius": "999px", "--LinearProgress-thickness": "6px" }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateCourseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
