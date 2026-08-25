import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Megaphone } from "lucide-react";
import Button from "@mui/joy/Button";
import Checkbox from "@mui/joy/Checkbox";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Stack from "@mui/joy/Stack";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip } from "@/components/common/StatusChip";
import { sendAnnouncement, fetchSentAnnouncements, selectSentAnnouncements, selectSendAnnouncementStatus } from "@/features/announcements/announcementsSlice";
import { fetchActivities, selectActivities } from "@/features/activities/activitiesSlice";
import { fetchAssignments, selectAssignments } from "@/features/activities/assignmentsSlice";
import { fetchOfficers, selectOfficers } from "@/features/personnel/officersSlice";
import { fetchDirectingStaff, selectDirectingStaff } from "@/features/personnel/directingStaffSlice";
import { selectActiveCourse } from "@/features/courses/coursesSlice";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { formatDateTime } from "@/lib/utils";
import type { AnnouncementScope } from "@/types";

const labelSx = { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" } as const;

const adminScopes: { value: AnnouncementScope; label: string }[] = [
  { value: "all_officers", label: "All Officers" },
  { value: "all_ds", label: "All Directing Staff" },
  { value: "course", label: "This Course" },
  { value: "land_group", label: "Land Group" },
  { value: "activity", label: "Activity" },
  { value: "individual", label: "Individuals" },
];

const dsScopes: { value: AnnouncementScope; label: string }[] = [
  { value: "activity", label: "Activity" },
  { value: "individual", label: "Individuals" },
];

// Shared by /admin/announcements and /ds/announcements — the scope options
// (and, for "individual", the eligible recipient list) adapt to the
// sender's role, per project-overview.md: DS can only target their own
// officers, filtered by Activity or individually.
export function AnnouncementComposerPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const course = useAppSelector(selectActiveCourse);
  const activities = useAppSelector(selectActivities);
  const assignments = useAppSelector(selectAssignments);
  const officers = useAppSelector(selectOfficers);
  const directingStaff = useAppSelector(selectDirectingStaff);
  const sent = useAppSelector(selectSentAnnouncements);
  const sendStatus = useAppSelector(selectSendAnnouncementStatus);

  const isDs = user?.role === "directing_staff";
  const scopeOptions = isDs ? dsScopes : adminScopes;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<AnnouncementScope>(isDs ? "activity" : "all_officers");
  const [landGroupId, setLandGroupId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);

  useEffect(() => {
    if (course) {
      dispatch(fetchActivities(course.id));
      dispatch(fetchAssignments(course.id));
      dispatch(fetchOfficers(course.id));
      if (!isDs) dispatch(fetchDirectingStaff(course.id));
    }
    dispatch(fetchSentAnnouncements());
  }, [dispatch, course, isDs]);

  const myActivityIds = isDs ? new Set(assignments.map((a) => a.activityId)) : null;
  const eligibleActivities = myActivityIds ? activities.filter((a) => myActivityIds.has(a.id)) : activities;

  function toggleRecipient(id: string) {
    setRecipientIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function reset() {
    setTitle("");
    setBody("");
    setLandGroupId("");
    setActivityId("");
    setRecipientIds([]);
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    try {
      await dispatch(
        sendAnnouncement({
          title,
          body,
          scope,
          courseId: scope === "course" ? course?.id : undefined,
          landGroupId: scope === "land_group" ? landGroupId : undefined,
          activityId: scope === "activity" ? activityId : undefined,
          recipientIds: scope === "individual" ? recipientIds : undefined,
        }),
      ).unwrap();
      toast.success("Announcement sent — in-app, SMS, and email delivery attempted for every recipient.");
      reset();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not send announcement.");
    }
  }

  const canSend =
    title.trim() &&
    body.trim() &&
    (scope !== "land_group" || landGroupId) &&
    (scope !== "activity" || activityId) &&
    (scope !== "individual" || recipientIds.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        Announcements
      </Typography>

      <Card title="Compose Announcement">
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel sx={labelSx}>Title</FormLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormControl>
          <FormControl required>
            <FormLabel sx={labelSx}>Message</FormLabel>
            <Textarea minRows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
          </FormControl>
          <FormControl required>
            <FormLabel sx={labelSx}>Recipients</FormLabel>
            <Select value={scope} onChange={(_, v) => v && setScope(v)}>
              {scopeOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </FormControl>

          {scope === "land_group" ? (
            <FormControl required>
              <FormLabel sx={labelSx}>Land Group</FormLabel>
              <Select placeholder="Select Land Group" value={landGroupId || null} onChange={(_, v) => v && setLandGroupId(v)}>
                {course?.landGroups.map((g) => (
                  <Option key={g.id} value={g.id}>
                    {g.name === "red" ? "Red Land" : "Blue Land"}
                  </Option>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {scope === "activity" ? (
            <FormControl required>
              <FormLabel sx={labelSx}>Activity</FormLabel>
              <Select placeholder="Select Activity" value={activityId || null} onChange={(_, v) => v && setActivityId(v)}>
                {eligibleActivities.map((a) => (
                  <Option key={a.id} value={a.id}>
                    {a.name}
                  </Option>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {scope === "individual" ? (
            <FormControl required>
              <FormLabel sx={labelSx}>Select Officers ({recipientIds.length} selected)</FormLabel>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
                {officers.map((o) => (
                  <Checkbox
                    key={o.id}
                    label={`${o.user.rank} ${o.user.fullName} (${o.user.armyNumber})`}
                    checked={recipientIds.includes(o.user.id)}
                    onChange={() => toggleRecipient(o.user.id)}
                  />
                ))}
                {!isDs
                  ? directingStaff.map((d) => (
                      <Checkbox
                        key={d.id}
                        label={`${d.user.rank} ${d.user.fullName} (${d.user.armyNumber}) — DS`}
                        checked={recipientIds.includes(d.user.id)}
                        onChange={() => toggleRecipient(d.user.id)}
                      />
                    ))
                  : null}
              </div>
            </FormControl>
          ) : null}

          <Button color="primary" loading={sendStatus === "loading"} disabled={!canSend} onClick={handleSend}>
            Send Announcement
          </Button>
        </Stack>
      </Card>

      <Typography level="title-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
        Sent History
      </Typography>
      {sent.length === 0 ? (
        <Card>
          <EmptyState icon={Megaphone} title="No announcements sent yet" />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sent.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                    {a.title}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)" }}>
                    {a.body}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                    {formatDateTime(a.createdAt)}
                  </Typography>
                </div>
                <StatusChip label={`${a.recipientCount} recipients`} tone="info" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
