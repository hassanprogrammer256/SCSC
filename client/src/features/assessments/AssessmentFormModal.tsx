import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import Button from "@mui/joy/Button";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import FormControl from "@mui/joy/FormControl";
import FormHelperText from "@mui/joy/FormHelperText";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import Textarea from "@mui/joy/Textarea";
import { saveAssessmentSchedule } from "@/features/assessments/assessmentsSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch } from "@/app/hooks";
import { countdownLabel } from "@/lib/utils";
import type { Activity, AssessmentSchedule } from "@/types";

const labelSx = { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" } as const;

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

type Props = {
  open: boolean;
  onClose: () => void;
  activity: Activity;
  schedule?: AssessmentSchedule | null;
};

export function AssessmentFormModal({ open, onClose, activity, schedule }: Props) {
  const dispatch = useAppDispatch();
  const courseId = useSelectedCourseId();

  const [instructions, setInstructions] = useState(schedule?.instructions ?? "");
  const [deadline, setDeadline] = useState(
    schedule ? toLocalInputValue(schedule.deadline) : toLocalInputValue(new Date().toISOString()),
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!courseId || !deadline) return;

    setSubmitting(true);
    try {
      await dispatch(
        saveAssessmentSchedule({
          courseId,
          existingId: schedule?.id,
          input: { activityId: activity.id, instructions, deadline: new Date(deadline).toISOString() },
        }),
      ).unwrap();
      toast.success(`Deadline set for ${activity.name}.`);
      onClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not save assessment schedule.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: "460px" }}>
        <DialogTitle>{schedule ? "Edit" : "Schedule"} Assessment — {activity.name}</DialogTitle>
        <DialogContent>The deadline governs both the officer's submission window and the DS's marking window.</DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel sx={labelSx}>Instructions / Guide</FormLabel>
              <Textarea
                minRows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Assessment guide for officers and the marking DS…"
              />
            </FormControl>
            <FormControl required>
              <FormLabel sx={labelSx}>Deadline</FormLabel>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
              {deadline ? (
                <FormHelperText sx={{ color: "var(--color-text-muted)" }}>
                  {countdownLabel(new Date(deadline).toISOString())}
                </FormHelperText>
              ) : null}
            </FormControl>
            <Button type="submit" loading={submitting} color="primary" disabled={!courseId}>
              {schedule ? "Save Changes" : "Schedule Assessment"}
            </Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
