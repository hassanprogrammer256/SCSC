import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/common/ComingSoon";
import { LoginPage } from "@/features/auth/LoginPage";
import { AdminDashboard } from "@/features/dashboard/AdminDashboard";
import { DsDashboard } from "@/features/dashboard/DsDashboard";
import { OfficerDashboard } from "@/features/dashboard/OfficerDashboard";
import { CoursesListPage } from "@/features/courses/CoursesListPage";
import { CourseDetailPage } from "@/features/courses/CourseDetailPage";
import { LandGroupsPage } from "@/features/courses/LandGroupsPage";
import { OfficersPage } from "@/features/personnel/OfficersPage";
import { DirectingStaffPage } from "@/features/personnel/DirectingStaffPage";
import { ActivitiesPage } from "@/features/activities/ActivitiesPage";
import { AssignmentBoard } from "@/features/activities/AssignmentBoard";
import { TimetablePage } from "@/features/timetable/TimetablePage";
import { AssessmentsPage } from "@/features/assessments/AssessmentsPage";
import { OfficerActivitiesPage } from "@/features/assessments/OfficerActivitiesPage";
import { OfficerActivityDetailPage } from "@/features/assessments/OfficerActivityDetailPage";
import { OfficerProgressPage } from "@/features/assessments/OfficerProgressPage";
import { DsAssessmentsPage } from "@/features/assessments/DsAssessmentsPage";
import { DsMarkingPage } from "@/features/assessments/DsMarkingPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { DsReportSubmitPage } from "@/features/reports/DsReportSubmitPage";
import { AnnouncementComposerPage } from "@/features/announcements/AnnouncementComposerPage";
import { NotificationCenterPage } from "@/features/announcements/NotificationCenterPage";
import { ArchivePage } from "@/features/courses/ArchivePage";
import { ArchivedCourseDetailPage } from "@/features/courses/ArchivedCourseDetailPage";
import { UsersPage } from "@/features/admin/UsersPage";
import { ProfilePage } from "@/features/auth/ProfilePage";
import { DsOfficersPage } from "@/features/personnel/DsOfficersPage";
import { DsActivitiesPage } from "@/features/activities/DsActivitiesPage";
import { OfficerSubmissionsPage } from "@/features/assessments/OfficerSubmissionsPage";
import { OfficerMarksPage } from "@/features/assessments/OfficerMarksPage";
import { RequireAuth } from "@/app/RequireAuth";
import { RequireRole } from "@/app/RequireRole";
import { navConfigByRole, roleHomePath } from "@/app/navConfig";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";

// Phase 2 (Course & Personnel Management) + Phase 3 (Activities & Assignments)
// built pages, keyed by their full nav path — every other admin nav item
// still renders ComingSoon until its build-plan phase lands.
const adminPageByPath: Record<string, ReactNode> = {
  "/admin/dashboard": <AdminDashboard />,
  "/admin/courses": <CoursesListPage />,
  "/admin/officers": <OfficersPage />,
  "/admin/directing-staff": <DirectingStaffPage />,
  "/admin/land-groups": <LandGroupsPage />,
  "/admin/activities": <ActivitiesPage />,
  "/admin/assignments": <AssignmentBoard />,
  "/admin/timetable": <TimetablePage />,
  "/admin/assessments": <AssessmentsPage />,
  "/admin/reports": <ReportsPage />,
  "/admin/announcements": <AnnouncementComposerPage />,
  "/admin/archive": <ArchivePage />,
  "/admin/users": <UsersPage />,
};

// Phase 5 (Submissions, Plagiarism & Grading) built pages for the DS and
// Officer role trees — same keyed-by-nav-path pattern as adminPageByPath.
const dsPageByPath: Record<string, ReactNode> = {
  "/ds/dashboard": <DsDashboard />,
  "/ds/officers": <DsOfficersPage />,
  "/ds/activities": <DsActivitiesPage />,
  "/ds/assessments": <DsAssessmentsPage />,
  "/ds/reports/submit": <DsReportSubmitPage />,
  "/ds/announcements": <AnnouncementComposerPage />,
};

const officerPageByPath: Record<string, ReactNode> = {
  "/officer/dashboard": <OfficerDashboard />,
  "/officer/activities": <OfficerActivitiesPage />,
  "/officer/submissions": <OfficerSubmissionsPage />,
  "/officer/marks": <OfficerMarksPage />,
  "/officer/progress": <OfficerProgressPage />,
  "/officer/announcements": <NotificationCenterPage />,
  "/officer/profile": <ProfilePage />,
};

function HomeRedirect() {
  const user = useAppSelector(selectCurrentUser);
  return <Navigate to={user ? roleHomePath[user.role] : "/login"} replace />;
}

// Only the Dashboard page is built for real right now — every other nav item
// in navConfig.ts renders ComingSoon until its build-plan phase lands.
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<RequireAuth />}>
        <Route path="/admin/*" element={<RequireRole role="admin" />}>
          <Route element={<AppShell />}>
            {navConfigByRole.admin.flatMap((group) =>
              group.items.map((item) => (
                <Route
                  key={item.path}
                  path={item.path.replace("/admin/", "")}
                  element={adminPageByPath[item.path] ?? <ComingSoon title={item.label} />}
                />
              )),
            )}
            <Route path="courses/:courseId" element={<CourseDetailPage />} />
            <Route path="archive/:courseId" element={<ArchivedCourseDetailPage />} />
            {/* No "Profile" nav item for Admin/DS (only Officer has one) —
                both roles still reach their own profile via the topbar
                dropdown, so this needs a manual route same as courses/:id. */}
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<ComingSoon title="Page Not Found" />} />
          </Route>
        </Route>

        <Route path="/ds/*" element={<RequireRole role="directing_staff" />}>
          <Route element={<AppShell />}>
            {navConfigByRole.directing_staff.flatMap((group) =>
              group.items.map((item) => (
                <Route
                  key={item.path}
                  path={item.path.replace("/ds/", "")}
                  element={dsPageByPath[item.path] ?? <ComingSoon title={item.label} />}
                />
              )),
            )}
            <Route path="assessments/:assessmentId/marking" element={<DsMarkingPage />} />
            {/* No "Profile" nav item for DS (only Officer has one) — reached
                via the topbar dropdown, so this needs a manual route same
                as the admin branch's. */}
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<ComingSoon title="Page Not Found" />} />
          </Route>
        </Route>

        <Route path="/officer/*" element={<RequireRole role="officer" />}>
          <Route element={<AppShell />}>
            {navConfigByRole.officer.flatMap((group) =>
              group.items.map((item) => (
                <Route
                  key={item.path}
                  path={item.path.replace("/officer/", "")}
                  element={officerPageByPath[item.path] ?? <ComingSoon title={item.label} />}
                />
              )),
            )}
            <Route path="activities/:activityId" element={<OfficerActivityDetailPage />} />
            <Route path="*" element={<ComingSoon title="Page Not Found" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
