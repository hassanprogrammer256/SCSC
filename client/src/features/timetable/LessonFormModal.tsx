import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import Button from "@mui/joy/Button";
import DialogActions from "@mui/joy/DialogActions";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Stack from "@mui/joy/Stack";
import { createTimetableEntry, deleteTimetableEntry, updateTimetableEntry } from "@/features/timetable/timetableSlice";
import { selectActivities } from "@/features/activities/activitiesSlice";
import { selectCourseById } from "@/features/courses/coursesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { TimetableEntry } from "@/types";

const labelSx = { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" } as const;

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

type Props = {
  open: boolean;
  onClose: () => void;
  entry?: TimetableEntry | null;
  // Pre-fills the date when opened by clicking a calendar day cell.
  defaultDate?: Date | null;
};

export function LessonFormModal({ open, onClose, entry, defaultDate }: Props) {
  const dispatch = useAppDispatch();
  const courseId = useSelectedCourseId();
  const course = useAppSelector(selectCourseById(courseId ?? undefined));
  const activities = useAppSelector(selectActivities);

  const base = defaultDate ?? new Date();
  const defaultStart = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0).toISOString();
  const defaultEnd = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 11, 0).toISOString();

  const [activityId, setActivityId] = useState(entry?.activityId ?? "");
  const [landGroupId, setLandGroupId] = useState(
    entry ? (course?.landGroups.find((g) => g.name === entry.landGroup)?.id ?? "") : "",
  );
  const [room, setRoom] = useState(entry?.room ?? "");
  const [startAt, setStartAt] = useState(toLocalInputValue(entry?.startAt ?? defaultStart));
  const [endAt, setEndAt] = useState(toLocalInputValue(entry?.endAt ?? defaultEnd));
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!courseId || !activityId || !landGroupId || !room || !startAt || !endAt) return;

    const input = {
      activityId,
      landGroupId,
      room,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
    };

    setSubmitting(true);
    try {
      if (entry) {
        await dispatch(updateTimetableEntry({ courseId, entryId: entry.id, input })).unwrap();
        toast.success("Lesson updated.");
      } else {
        await dispatch(createTimetableEntry({ courseId, input })).unwrap();
        toast.success("Lesson scheduled.");
      }
      onClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not save lesson.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!courseId || !entry) return;
    setDeleting(true);
    try {
      await dispatch(deleteTimetableEntry({ courseId, entryId: entry.id })).unwrap();
      toast.success("Lesson removed.");
      onClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not delete lesson.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: "420px" }}>
        <DialogTitle>{entry ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
        <DialogContent>Same Room and overlapping time window is rejected as a conflict.</DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <FormControl required>
              <FormLabel sx={labelSx}>Activity</FormLabel>
              <Select placeholder="Select Activity" value={activityId || null} onChange={(_, v) => v && setActivityId(v)}>
                {activities.map((activity) => (
                  <Option key={activity.id} value={activity.id}>
                    {activity.name}
                  </Option>
                ))}
              </Select>
            </FormControl>
            <FormControl required>
              <FormLabel sx={labelSx}>Land Group</FormLabel>
              <Select placeholder="Select Land Group" value={landGroupId || null} onChange={(_, v) => v && setLandGroupId(v)}>
                {course?.landGroups.map((group) => (
                  <Option key={group.id} value={group.id}>
                    {group.name === "red" ? "Red Land" : "Blue Land"}
                  </Option>
                ))}
              </Select>
            </FormControl>
            <FormControl required>
              <FormLabel sx={labelSx}>Room</FormLabel>
              <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Lecture Hall 2" required />
            </FormControl>
            <FormControl required>
              <FormLabel sx={labelSx}>Start</FormLabel>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
            </FormControl>
            <FormControl required>
              <FormLabel sx={labelSx}>End</FormLabel>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
            </FormControl>
            <DialogActions sx={{ px: 0 }}>
              {entry ? (
                <Button variant="outlined" color="danger" onClick={handleDelete} loading={deleting} disabled={submitting}>
                  Delete
                </Button>
              ) : null}
              <Button type="submit" color="primary" loading={submitting} disabled={!courseId || deleting}>
                {entry ? "Save Changes" : "Add Lesson"}
              </Button>
            </DialogActions>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
