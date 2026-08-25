import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Archive } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { fetchCourses, selectArchivedCourses, selectCoursesStatus } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

// Admin-only /admin/archive — build-plan.md Phase 8 feature 30. Read-only
// list of completed-and-archived courses; each links to
// ArchivedCourseDetailPage, which renders every tab with no create/edit/
// delete control anywhere in its component tree (not just disabled).
export function ArchivePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const archived = useAppSelector(selectArchivedCourses);
  const status = useAppSelector(selectCoursesStatus);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Archive
      </Typography>

      {status === "loading" && archived.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : archived.length === 0 ? (
        <Card>
          <EmptyState icon={Archive} title="No archived courses yet" description="Completed courses appear here once archived." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archived.map((course) => (
            <Card key={course.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-2" onClick={() => navigate(`/admin/archive/${course.id}`)}>
                <Typography sx={{ color: "var(--color-text-primary)", fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  {course.code}
                </Typography>
                <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                  {course.officerCount} Officers · {course.directingStaffCount} DS
                </Typography>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
