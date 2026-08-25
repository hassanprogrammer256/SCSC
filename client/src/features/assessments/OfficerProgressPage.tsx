import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import CircularProgress from "@mui/joy/CircularProgress";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { GradeChip } from "@/components/common/GradeChip";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { ActivityStatusList } from "@/components/common/ActivityStatusList";
import { fetchMyOfficerProfile, selectMyOfficerProfile } from "@/features/personnel/officersSlice";
import { fetchOfficerProgress, selectOfficerProgress, selectOfficerProgressStatus } from "@/features/assessments/officerProgressSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { degreeClassLabel } from "@/lib/utils";
import type { OfficerActivityProgress } from "@/types";

export function OfficerProgressPage() {
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectActiveCourse);
  const myProfile = useAppSelector(selectMyOfficerProfile);
  const progress = useAppSelector(selectOfficerProgress);
  const status = useAppSelector(selectOfficerProgressStatus);

  useEffect(() => {
    if (course) dispatch(fetchMyOfficerProfile(course.id));
  }, [dispatch, course]);

  useEffect(() => {
    if (course && myProfile) dispatch(fetchOfficerProgress({ courseId: course.id, officerId: myProfile.id }));
  }, [dispatch, course, myProfile]);

  if (!course) {
    return (
      <Card>
        <EmptyState icon={GraduationCap} title="No active course" description="You are not enrolled on an active course." />
      </Card>
    );
  }

  if (status === "loading" || !progress) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress size="md" />
      </div>
    );
  }

  const activityRows: OfficerActivityProgress[] = progress.activities.map((a) => ({
    activityId: a.activityId,
    activityName: a.activityName,
    weightPercent: a.weightPercent,
    status: a.isComplete ? "marked" : a.score !== null ? "submitted" : "not_submitted",
    score: a.score,
    gradeBand: a.grade,
    remarks: a.remarks,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Academic Progress
      </Typography>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Course Completion">
          <div className="flex flex-col items-center gap-4 py-2">
            <ProgressRing percent={progress.progressPercent} label="Course Progress" />
          </div>
        </Card>
        <Card title="Projected Degree Class">
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            {progress.degreeClass ? (
              <>
                <GradeChip band={progress.degreeClass} />
                <Typography level="body-sm" sx={{ color: "var(--color-text-secondary)" }}>
                  {degreeClassLabel[progress.degreeClass]}
                </Typography>
                {progress.weightedAverage !== null ? (
                  <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                    Weighted average: {progress.weightedAverage.toFixed(1)}%
                  </Typography>
                ) : null}
              </>
            ) : (
              <Typography level="body-sm" sx={{ color: "var(--color-text-muted)" }}>
                Projected once every mandatory activity is marked complete.
              </Typography>
            )}
          </div>
        </Card>
      </div>

      <ActivityStatusList activities={activityRows} />
    </div>
  );
}
