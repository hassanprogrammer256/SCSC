import { useEffect } from "react";
import { Award, Calendar, ClipboardList, GraduationCap, Megaphone, ShieldCheck, Users } from "lucide-react";
import { WelcomeBanner } from "@/components/common/WelcomeBanner";
import { StatCard } from "@/components/common/StatCard";
import { DeadlineList } from "@/components/common/DeadlineList";
import { NoticeBoard } from "@/components/common/NoticeBoard";
import { ActivityFeed } from "@/components/common/ActivityFeed";
import { QuickLinksGrid, type QuickLink } from "@/components/common/QuickLinksGrid";
import { LandGroupComparisonChart } from "@/components/charts/LandGroupComparisonChart";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchCourses, selectActiveCourse, selectCourses } from "@/features/courses/coursesSlice";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import { fetchMarks, selectMarks } from "@/features/assessments/marksSlice";
import { fetchOfficers, selectOfficers } from "@/features/personnel/officersSlice";
import { selectCurrentUser } from "@/features/auth/authSlice";
// Notices and the activity feed have no real backend source yet — Notices
// is Phase 7 (Announcements) and there is no audit-log feature anywhere in
// build-plan.md, so both stay on mock/presentational data until (if ever)
// those features exist. Every other widget below is wired to real data.
import { mockActivityFeed, mockNotices } from "@/lib/mocks/dashboard";
import type { DeadlineItem } from "@/types";

const quickLinks: QuickLink[] = [
  { label: "Courses", path: "/admin/courses", icon: GraduationCap, color: "primary" },
  { label: "Officers", path: "/admin/officers", icon: Users, color: "info" },
  { label: "Directing Staff", path: "/admin/directing-staff", icon: ShieldCheck, color: "accent" },
  { label: "Activities", path: "/admin/activities", icon: ClipboardList, color: "success" },
  { label: "Timetable", path: "/admin/timetable", icon: Calendar, color: "warning" },
  { label: "Announcements", path: "/admin/announcements", icon: Megaphone, color: "error" },
];

export function AdminDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const course = useAppSelector(selectActiveCourse);
  const courses = useAppSelector(selectCourses);
  const activities = useAppSelector(selectActivities);
  const schedules = useAppSelector(selectAssessmentSchedules);
  const marks = useAppSelector(selectMarks);
  const officers = useAppSelector(selectOfficers);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
      dispatch(fetchMarks(course.id));
      dispatch(fetchOfficers(course.id));
    }
  }, [dispatch, course]);

  const activeCoursesCount = courses.filter((c) => c.status === "active").length;
  const overallCompletion = course?.progressPercent ?? 0;

  const officerLandGroupById = new Map(officers.map((o) => [o.id, o.landGroup]));
  const landGroupComparison = activities.map((activity) => {
    const activityMarks = marks.filter((m) => m.activityName === activity.name);
    const redScores = activityMarks.filter((m) => officerLandGroupById.get(m.officerId) === "red").map((m) => m.score);
    const blueScores = activityMarks.filter((m) => officerLandGroupById.get(m.officerId) === "blue").map((m) => m.score);
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
    return { activity: activity.name.split(" ").slice(0, 2).join(" "), red: avg(redScores), blue: avg(blueScores) };
  });

  const deadlines: DeadlineItem[] = schedules.map((s) => {
    const activity = activities.find((a) => a.id === s.activityId);
    return { id: s.id, activityName: activity?.name ?? "Activity", courseCode: course?.code ?? "", landGroup: "both", deadline: s.deadline };
  });

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner
        greeting="Welcome back"
        name={`${user?.rank ?? ""} ${user?.fullName ?? ""}`}
        subtitle={course ? `College-wide overview — Course ${course.code}` : "College-wide overview"}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} value={course?.officerCount ?? 0} label="Total Officers" subLine={course ? `Course ${course.code}` : ""} color="primary" />
        <StatCard icon={ShieldCheck} value={course?.directingStaffCount ?? 0} label="Directing Staff" subLine="Across all activities" color="info" />
        <StatCard icon={GraduationCap} value={activeCoursesCount} label="Active Courses" subLine="Currently running" color="accent" />
        <StatCard icon={Award} value={`${overallCompletion}%`} label="Overall Completion" subLine="Weighted across officers" color="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LandGroupComparisonChart data={landGroupComparison} />
        </div>
        <DeadlineList deadlines={deadlines} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <QuickLinksGrid links={quickLinks} />
        <NoticeBoard notices={mockNotices} />
        <ActivityFeed items={mockActivityFeed} />
      </div>
    </div>
  );
}
