import { useEffect } from "react";
import Typography from "@mui/joy/Typography";
import { WelcomeBanner } from "@/components/common/WelcomeBanner";
import { Card } from "@/components/common/Card";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { GradeChip } from "@/components/common/GradeChip";
import { DeadlineList } from "@/components/common/DeadlineList";
import { ActivityStatusList } from "@/components/common/ActivityStatusList";
import { RemarksList } from "@/components/common/RemarksList";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { MarksBarChart } from "@/components/charts/MarksBarChart";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchMyOfficerProfile, selectMyOfficerProfile } from "@/features/personnel/officersSlice";
import { fetchOfficerProgress, selectOfficerProgress } from "@/features/assessments/officerProgressSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { degreeClassLabel } from "@/lib/utils";
import type { DeadlineItem, OfficerActivityProgress } from "@/types";

export function OfficerDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const course = useAppSelector(selectActiveCourse);
  const myProfile = useAppSelector(selectMyOfficerProfile);
  const progress = useAppSelector(selectOfficerProgress);
  const schedules = useAppSelector(selectAssessmentSchedules);

  useEffect(() => {
    if (course) {
      dispatch(fetchMyOfficerProfile(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
    }
  }, [dispatch, course]);

  useEffect(() => {
    if (course && myProfile) dispatch(fetchOfficerProgress({ courseId: course.id, officerId: myProfile.id }));
  }, [dispatch, course, myProfile]);

  const activityRows: OfficerActivityProgress[] = (progress?.activities ?? []).map((a) => ({
    activityId: a.activityId,
    activityName: a.activityName,
    weightPercent: a.weightPercent,
    status: a.isComplete ? "marked" : a.score !== null ? "submitted" : "not_submitted",
    score: a.score,
    gradeBand: a.grade,
    remarks: a.remarks,
  }));

  const deadlines: DeadlineItem[] = schedules.map((s) => ({
    id: s.id,
    activityName: s.instructions ? s.instructions.slice(0, 40) : "Assessment",
    courseCode: course?.code ?? "",
    landGroup: myProfile?.landGroup ?? "both",
    deadline: s.deadline,
  }));

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner
        greeting="Welcome back"
        name={`${user?.rank ?? ""} ${user?.fullName ?? ""}`}
        subtitle={course ? `Course ${course.code}` : "No active course"}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Academic Progress">
          <div className="flex flex-col items-center gap-4">
            <ProgressRing percent={progress?.progressPercent ?? 0} label="Course Progress" />
            <div className="flex w-full items-center justify-between border-t border-border pt-3">
              <div className="flex flex-col gap-1">
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  Weighted Average
                </Typography>
                <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                  {progress?.weightedAverage !== null && progress?.weightedAverage !== undefined ? `${progress.weightedAverage.toFixed(0)}%` : "—"}
                </Typography>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  Projected Degree Class
                </Typography>
                {progress?.degreeClass ? <GradeChip band={progress.degreeClass} /> : <Typography level="body-xs">Pending</Typography>}
              </div>
            </div>
            {progress?.degreeClass ? (
              <Typography level="body-xs" sx={{ color: "var(--color-text-muted)", textAlign: "center" }}>
                {degreeClassLabel[progress.degreeClass]} — provisional until every mandatory activity is marked.
              </Typography>
            ) : null}
            {myProfile ? <LandGroupChip landGroup={myProfile.landGroup} /> : null}
          </div>
        </Card>

        <div className="xl:col-span-2">
          <MarksBarChart activities={activityRows} />
        </div>
      </div>

      <ActivityStatusList activities={activityRows} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DeadlineList title="Upcoming Deadlines" deadlines={deadlines} />
        <RemarksList activities={activityRows} />
      </div>
    </div>
  );
}
