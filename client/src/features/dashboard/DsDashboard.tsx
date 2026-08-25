import { useEffect } from "react";
import { ClipboardCheck, ClipboardList, ShieldAlert, Users } from "lucide-react";
import Typography from "@mui/joy/Typography";
import { WelcomeBanner } from "@/components/common/WelcomeBanner";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/common/Card";
import { LandGroupChip } from "@/components/common/LandGroupChip";
import { DeadlineList } from "@/components/common/DeadlineList";
import { PendingMarkingList } from "@/components/common/PendingMarkingList";
import { RosterSnapshot } from "@/components/common/RosterSnapshot";
import { MiniCalendar } from "@/components/common/MiniCalendar";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssignments, selectAssignments } from "@/features/activities/assignmentsSlice";
import { fetchAssessmentSchedules, selectAssessmentSchedules } from "@/features/assessments/assessmentsSlice";
import { fetchSubmissions, selectSubmissions } from "@/features/assessments/submissionsSlice";
import { fetchMarks, selectMarks } from "@/features/assessments/marksSlice";
import { fetchOfficers, selectOfficers } from "@/features/personnel/officersSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { selectCurrentUser } from "@/features/auth/authSlice";
import type { DeadlineItem, PendingMarkingItem, RosterMember } from "@/types";

export function DsDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const course = useAppSelector(selectActiveCourse);
  const activities = useAppSelector(selectActivities);
  const assignments = useAppSelector(selectAssignments);
  const schedules = useAppSelector(selectAssessmentSchedules);
  const submissions = useAppSelector(selectSubmissions);
  const marks = useAppSelector(selectMarks);
  const officers = useAppSelector(selectOfficers);

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssignments(course.id));
      dispatch(fetchAssessmentSchedules(course.id));
      dispatch(fetchSubmissions(course.id));
      dispatch(fetchMarks(course.id));
      dispatch(fetchOfficers(course.id));
    }
  }, [dispatch, course]);

  const myAssignments = assignments
    .map((assignment) => ({ ...assignment, activity: activities.find((a) => a.id === assignment.activityId) }))
    .filter((a): a is typeof a & { activity: NonNullable<(typeof a)["activity"]> } => Boolean(a.activity));

  const pendingItems: PendingMarkingItem[] = submissions
    .filter((s) => !marks.some((m) => m.assessmentId === s.assessmentId && m.officerId === s.officerId && m.isComplete))
    .map((s) => ({
      submissionId: s.id,
      officerName: s.officerName,
      armyNumber: s.armyNumber,
      activityName: s.activityName,
      landGroup: s.landGroup,
      submittedAt: s.submittedAt,
      plagiarismStatus: s.plagiarismStatus ?? "not_checked",
      plagiarismScore: s.plagiarismScore ?? null,
    }));

  const deadlines: DeadlineItem[] = schedules
    .filter((s) => myAssignments.some((a) => a.activityId === s.activityId))
    .map((s) => {
      const activity = activities.find((a) => a.id === s.activityId);
      const assignment = myAssignments.find((a) => a.activityId === s.activityId);
      return {
        id: s.id,
        activityName: activity?.name ?? "Activity",
        courseCode: course?.code ?? "",
        landGroup: assignment?.landGroup ?? "both",
        deadline: s.deadline,
      };
    });

  const roster: RosterMember[] = officers.map((o) => ({
    id: o.id,
    armyNumber: o.user.armyNumber,
    rank: o.user.rank,
    fullName: o.user.fullName,
    landGroup: o.landGroup,
    avatarUrl: o.user.avatarUrl,
    statusLabel: "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner
        greeting="Good day"
        name={`${user?.rank ?? ""} ${user?.fullName ?? ""}`}
        subtitle={course ? `Course ${course.code}` : "No active course"}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} value={myAssignments.length} label="Assigned Activities" color="primary" />
        <StatCard icon={Users} value={roster.length} label="Officers Under You" color="info" />
        <StatCard icon={ShieldAlert} value={pendingItems.length} label="Pending Marking" subLine="Awaiting your marks" color="warning" />
        <StatCard icon={ClipboardCheck} value={deadlines.length} label="Upcoming Deadlines" color="accent" />
      </div>

      <Card title="My Assigned Activities">
        <div className="flex flex-col">
          {myAssignments.map(({ id, activity, landGroup }) => (
            <div key={id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
              <div className="flex flex-col gap-1">
                <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {activity.name}
                </Typography>
                <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                  Weight {activity.weightPercent}%
                </Typography>
              </div>
              <LandGroupChip landGroup={landGroup} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PendingMarkingList items={pendingItems} />
        </div>
        <DeadlineList deadlines={deadlines} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RosterSnapshot title="Officers Under Your Activities" officers={roster} />
        </div>
        <MiniCalendar year={2026} month={7} today={24} highlightDays={[27, 29]} />
      </div>
    </div>
  );
}
