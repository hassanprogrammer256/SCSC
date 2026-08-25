import type {
  ActivityFeedItem,
  DeadlineItem,
  NoticeItem,
  OfficerActivityProgress,
  PendingMarkingItem,
} from "@/types";

export const mockDeadlines: DeadlineItem[] = [
  { id: "dl-1", activityName: "Staff Duties Examination", courseCode: "2026/27", landGroup: "both", deadline: "2026-08-27T17:00:00" },
  { id: "dl-2", activityName: "Command Post Exercise", courseCode: "2026/27", landGroup: "red", deadline: "2026-08-29T12:00:00" },
  { id: "dl-3", activityName: "Leadership & Ethics Seminar", courseCode: "2026/27", landGroup: "blue", deadline: "2026-09-02T17:00:00" },
  { id: "dl-4", activityName: "Tactical Exercise Without Troops", courseCode: "2026/27", landGroup: "both", deadline: "2026-09-08T17:00:00" },
];

export const mockNotices: NoticeItem[] = [
  { id: "nt-1", title: "Staff Duties Examination guide released", addedOn: "2026-08-20", daysLeft: 7 },
  { id: "nt-2", title: "Change to Command Post Exercise room allocation", addedOn: "2026-08-19", daysLeft: 8 },
  { id: "nt-3", title: "Mid-course medical checks scheduled", addedOn: "2026-08-15", daysLeft: 12 },
  { id: "nt-4", title: "Land Group photo session — Friday 0700h", addedOn: "2026-08-12", daysLeft: 15 },
];

export const mockActivityFeed: ActivityFeedItem[] = [
  { id: "af-1", actor: "Lt. Col. Peter Okello", action: "awarded marks for Strategic Studies Paper — Red Land", timestamp: "2026-08-23T14:20:00" },
  { id: "af-2", actor: "Maj. Aisha Byaruhanga", action: "submitted Command Post Exercise coursework", timestamp: "2026-08-23T09:05:00" },
  { id: "af-3", actor: "Col. Grace Nakato", action: "assigned Lt. Col. James Mwangi to Strategic Studies Paper — Blue Land", timestamp: "2026-08-22T16:40:00" },
  { id: "af-4", actor: "Col. Eric Habimana", action: "approved activity completion for 6 officers", timestamp: "2026-08-21T11:15:00" },
  { id: "af-5", actor: "Col. Grace Nakato", action: "archived Course 2025/26", timestamp: "2026-08-18T08:30:00" },
];

export const mockPendingMarking: PendingMarkingItem[] = [
  { submissionId: "sub-1", officerName: "Claudine Uwase", armyNumber: "RDF-O2098", activityName: "Strategic Studies Paper", landGroup: "red", submittedAt: "2026-08-22T18:40:00", plagiarismStatus: "completed", plagiarismScore: 12 },
  { submissionId: "sub-2", officerName: "Brian Kiptoo", armyNumber: "KDF-O1187", activityName: "Strategic Studies Paper", landGroup: "red", submittedAt: "2026-08-22T20:05:00", plagiarismStatus: "completed", plagiarismScore: 34 },
  { submissionId: "sub-3", officerName: "Desire Nkurunziza", armyNumber: "BDF-O0456", activityName: "Tactical Exercise Without Troops", landGroup: "red", submittedAt: "2026-08-23T07:55:00", plagiarismStatus: "completed", plagiarismScore: 61 },
  { submissionId: "sub-4", officerName: "Aisha Byaruhanga", armyNumber: "UPDF-O3006", activityName: "Tactical Exercise Without Troops", landGroup: "red", submittedAt: "2026-08-23T08:10:00", plagiarismStatus: "not_checked", plagiarismScore: null },
  { submissionId: "sub-5", officerName: "Godfrey Massawe", armyNumber: "TPDF-O1290", activityName: "Command Post Exercise", landGroup: "blue", submittedAt: "2026-08-21T15:30:00", plagiarismStatus: "failed", plagiarismScore: null },
];

export const mockOfficerProgress: OfficerActivityProgress[] = [
  { activityId: "act-1", activityName: "Strategic Studies Paper", weightPercent: 20, status: "marked", score: 82, gradeBand: "distinction", remarks: "Sharp analysis of coalition logistics; tighten the recommendations section." },
  { activityId: "act-2", activityName: "Tactical Exercise Without Troops", weightPercent: 20, status: "submitted", score: null, gradeBand: null, remarks: null },
  { activityId: "act-3", activityName: "Command Post Exercise", weightPercent: 15, status: "not_submitted", score: null, gradeBand: null, remarks: null },
  { activityId: "act-4", activityName: "Leadership & Ethics Seminar", weightPercent: 15, status: "marked", score: 71, gradeBand: "merit", remarks: "Good command presence during the syndicate debate." },
  { activityId: "act-5", activityName: "Staff Duties Examination", weightPercent: 20, status: "not_submitted", score: null, gradeBand: null, remarks: null },
  { activityId: "act-6", activityName: "Physical Fitness Assessment", weightPercent: 10, status: "marked", score: 88, gradeBand: "distinction", remarks: "Exceeded the battle-fitness benchmark." },
];

export const adminStats = {
  totalOfficers: 96,
  totalDirectingStaff: 18,
  activeCourses: 1,
  overallCompletionPercent: 42,
};

export const dsStats = {
  assignedActivities: 2,
  officersAssigned: 48,
  pendingMarking: mockPendingMarking.length,
  upcomingDeadlines: mockDeadlines.length,
};

// Average weighted score per Land Group, per activity marked so far —
// feeds the Admin dashboard's Land Group comparison chart.
export const landGroupComparison = [
  { activity: "Strategic Studies", red: 78, blue: 74 },
  { activity: "Leadership & Ethics", red: 71, blue: 69 },
  { activity: "Fitness Assessment", red: 85, blue: 81 },
  { activity: "Command Post Ex.", red: 66, blue: 70 },
];
