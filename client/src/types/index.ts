export type Role = "admin" | "directing_staff" | "officer";

export type LandGroupName = "red" | "blue";

export type CourseStatus = "active" | "completed" | "archived";

export type GradeBand = "distinction" | "merit" | "pass" | "fail";

export type SubmissionStatus = "not_submitted" | "submitted" | "late" | "marked";

export type PlagiarismStatus = "not_checked" | "completed" | "failed";
export type PlagiarismBand = "plagiarised" | "paraphrased" | "original";

export type User = {
  id: string;
  armyNumber: string;
  role: Role;
  rank: string;
  fullName: string;
  country: string;
  phoneNumber: string;
  email: string;
  // The real accounts.User schema has no avatar field (no photo-upload
  // feature exists yet) — only mock roster data carries one.
  avatarUrl?: string;
  mustChangePassword: boolean;
  // Present on the /admin/users listing (accounts.UserSerializer); absent
  // from the login/refresh response shape's normal use, so optional.
  isActive?: boolean;
  createdAt?: string;
};

export type Course = {
  id: string;
  code: string;
  startYear: number;
  status: CourseStatus;
  officerCount: number;
  directingStaffCount: number;
  // Always 0 until Phase 5/6's grading service exists — see
  // context/build-plan.md, decided during /architect for Phase 2.
  progressPercent: number;
  landGroups: LandGroup[];
};

export type LandGroup = {
  id: string;
  courseId: string;
  name: LandGroupName;
};

export type OfficerProfile = {
  id: string;
  user: User;
  landGroup: LandGroupName;
};

export type DirectingStaffProfile = {
  id: string;
  user: User;
};

// Shared by both Register Officer and Register Directing Staff forms —
// landGroupId only applies to Officer registration.
export type RegisterPersonnelInput = {
  armyNumber: string;
  rank: string;
  fullName: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  landGroupId?: string;
  avatar?: File | null;
};

// Returned exactly once, on the registration response — never persisted or
// re-fetchable, per context/library-docs.md.
export type RegistrationResult<TProfile> = {
  profile: TProfile;
  initialPassword: string;
};

export type Activity = {
  id: string;
  courseId: string;
  name: string;
  weightPercent: number;
};

export type ActivityAssignment = {
  id: string;
  activityId: string;
  landGroup: LandGroupName;
  directingStaffId: string;
};

export type AssessmentSchedule = {
  id: string;
  activityId: string;
  deadline: string;
  instructions: string;
};

export type PlagiarismSource =
  | { type: "internal"; submissionId: string; officerName: string; armyNumber: string }
  | { type: "external"; url: string; title: string; snippet: string };

export type PlagiarismHighlight = {
  text: string;
  band: PlagiarismBand;
  similarityPercent: number;
  source: PlagiarismSource | null;
};

export type Submission = {
  id: string;
  assessmentId: string;
  activityName: string;
  officerId: string;
  officerName: string;
  armyNumber: string;
  landGroup: LandGroupName;
  fileType: "docx" | "pdf";
  fileUrl: string | null;
  submittedAt: string;
  isLate: boolean;
  // DS-only — neither OfficerSubmissionSerializer nor AdminSubmissionSerializer
  // sends these, so they're simply absent (not just hidden) on an
  // Officer- or Admin-fetched Submission. Plagiarism checking is DS-triggered
  // only (see MarkingRow) — Admin has no visibility into results at all.
  plagiarismStatus?: PlagiarismStatus;
  plagiarismScore?: number | null;
  plagiarismHighlights?: PlagiarismHighlight[];
  plagiarismExternalChecked?: boolean;
  plagiarismCheckedAt?: string | null;
};

export type Mark = {
  id: string;
  assessmentId: string;
  activityName: string;
  officerId: string;
  officerName: string;
  armyNumber: string;
  score: number;
  remarks: string;
  comments: string;
  isComplete: boolean;
  grade: GradeBand;
  markedAt: string;
};

export type OfficerActivityResult = {
  activityId: string;
  activityName: string;
  weightPercent: number;
  score: number | null;
  grade: GradeBand | null;
  isComplete: boolean;
  remarks: string | null;
  comments: string | null;
};

export type OfficerProgress = {
  activities: OfficerActivityResult[];
  progressPercent: number;
  weightedAverage: number | null;
  degreeClass: GradeBand | null;
};

export type ProgressReportRow = {
  officerId: string;
  armyNumber: string;
  fullName: string;
  landGroup: LandGroupName;
  progressPercent: number;
  weightedAverage: number | null;
  degreeClass: GradeBand | null;
  outstandingActivities: string[];
};

export type DsAssessmentReport = {
  id: string;
  assessmentId: string;
  activityName: string;
  directingStaffName: string;
  body: string;
  submittedAt: string;
};

export type AnnouncementScope = "all_officers" | "all_ds" | "course" | "land_group" | "activity" | "individual";

export type DeliveryStatus = "sent" | "failed" | "not_applicable";

export type Announcement = {
  id: string;
  senderName: string;
  title: string;
  body: string;
  scope: AnnouncementScope;
  courseId: string | null;
  landGroupId: string | null;
  activityId: string | null;
  recipientCount: number;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  announcementId: string;
  title: string;
  body: string;
  senderName: string;
  isRead: boolean;
  smsStatus: DeliveryStatus;
  emailStatus: DeliveryStatus;
  createdAt: string;
};

export type TimetableEntry = {
  id: string;
  activityId: string;
  activityName: string;
  landGroup: LandGroupName;
  room: string;
  startAt: string;
  endAt: string;
};

export type OfficerActivityProgress = {
  activityId: string;
  activityName: string;
  weightPercent: number;
  status: SubmissionStatus;
  score: number | null;
  gradeBand: GradeBand | null;
  remarks: string | null;
};

export type PendingMarkingItem = {
  submissionId: string;
  officerName: string;
  armyNumber: string;
  activityName: string;
  landGroup: LandGroupName;
  submittedAt: string;
  plagiarismStatus: PlagiarismStatus;
  plagiarismScore: number | null;
};

export type DeadlineItem = {
  id: string;
  activityName: string;
  courseCode: string;
  landGroup: LandGroupName | "both";
  deadline: string;
};

export type NoticeItem = {
  id: string;
  title: string;
  addedOn: string;
  daysLeft: number;
};

export type ActivityFeedItem = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
};

export type RosterMember = {
  id: string;
  armyNumber: string;
  rank: string;
  fullName: string;
  landGroup: LandGroupName;
  // Optional — the real accounts.User has no avatar field (see User type
  // above); only mock roster data carries one. RosterSnapshot's Avatar
  // falls back to its default icon when absent.
  avatarUrl?: string;
  statusLabel: string;
};
