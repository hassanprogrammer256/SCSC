import type { Course, LandGroup } from "@/types";

export const mockCourses: Course[] = [
  { id: "course-2026-27", code: "2026/27", startYear: 2026, status: "active", officerCount: 0, directingStaffCount: 0, progressPercent: 0, landGroups: [] },
  { id: "course-2025-26", code: "2025/26", startYear: 2025, status: "archived", officerCount: 0, directingStaffCount: 0, progressPercent: 0, landGroups: [] },
];

export const activeCourse = mockCourses[0];

export const mockLandGroups: LandGroup[] = [
  { id: "land-red", courseId: activeCourse.id, name: "red" },
  { id: "land-blue", courseId: activeCourse.id, name: "blue" },
];
