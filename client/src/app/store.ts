import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import themeReducer from "@/app/themeSlice";
import coursesReducer from "@/features/courses/coursesSlice";
import officersReducer from "@/features/personnel/officersSlice";
import directingStaffReducer from "@/features/personnel/directingStaffSlice";
import activitiesReducer from "@/features/activities/activitiesSlice";
import assignmentsReducer from "@/features/activities/assignmentsSlice";
import timetableReducer from "@/features/timetable/timetableSlice";
import assessmentSchedulesReducer from "@/features/assessments/assessmentsSlice";
import submissionsReducer from "@/features/assessments/submissionsSlice";
import marksReducer from "@/features/assessments/marksSlice";
import officerProgressReducer from "@/features/assessments/officerProgressSlice";
import reportsReducer from "@/features/reports/reportsSlice";
import announcementsReducer from "@/features/announcements/announcementsSlice";
import notificationsReducer from "@/features/announcements/notificationsSlice";
import usersReducer from "@/features/admin/usersSlice";
import { attachStore } from "@/lib/apiClient";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    courses: coursesReducer,
    officers: officersReducer,
    directingStaff: directingStaffReducer,
    activities: activitiesReducer,
    assignments: assignmentsReducer,
    timetable: timetableReducer,
    assessmentSchedules: assessmentSchedulesReducer,
    submissions: submissionsReducer,
    marks: marksReducer,
    officerProgress: officerProgressReducer,
    reports: reportsReducer,
    announcements: announcementsReducer,
    notifications: notificationsReducer,
    users: usersReducer,
  },
});

attachStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
