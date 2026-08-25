import type { Activity, ActivityAssignment } from "@/types";
import { activeCourse } from "./courses";

export const mockActivities: Activity[] = [
  { id: "act-1", courseId: activeCourse.id, name: "Strategic Studies Paper", weightPercent: 20 },
  { id: "act-2", courseId: activeCourse.id, name: "Tactical Exercise Without Troops", weightPercent: 20 },
  { id: "act-3", courseId: activeCourse.id, name: "Command Post Exercise", weightPercent: 15 },
  { id: "act-4", courseId: activeCourse.id, name: "Leadership & Ethics Seminar", weightPercent: 15 },
  { id: "act-5", courseId: activeCourse.id, name: "Staff Duties Examination", weightPercent: 20 },
  { id: "act-6", courseId: activeCourse.id, name: "Physical Fitness Assessment", weightPercent: 10 },
];

export const mockAssignments: ActivityAssignment[] = [
  { id: "asg-1", activityId: "act-1", landGroup: "red", directingStaffId: "ds-1" },
  { id: "asg-2", activityId: "act-1", landGroup: "blue", directingStaffId: "ds-2" },
  { id: "asg-3", activityId: "act-2", landGroup: "red", directingStaffId: "ds-1" },
  { id: "asg-4", activityId: "act-2", landGroup: "blue", directingStaffId: "ds-3" },
  { id: "asg-5", activityId: "act-3", landGroup: "red", directingStaffId: "ds-4" },
  { id: "asg-6", activityId: "act-3", landGroup: "blue", directingStaffId: "ds-5" },
];
