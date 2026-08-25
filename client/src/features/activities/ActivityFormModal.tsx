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
import { createActivity, selectActivityWeightTotal, updateActivity } from "@/features/activities/activitiesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { Activity } from "@/types";

const labelSx = { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" } as const;

type Props = {
  open: boolean;
  onClose: () => void;
  // Fixed when opened from a course's own Activities tab; falls back to the
  // topbar-selected course when opened from the global /admin/activities
  // page — same pattern as RegisterOfficerModal.
  courseId?: string;
  // Present means edit; the caller remounts this component with a
  // key={activity?.id ?? "new"} so the pre-filled state below only ever
  // needs to be set once per activity, no reset-on-open effect required.
  activity?: Activity | null;
};

export function ActivityFormModal({ open, onClose, courseId, activity }: Props) {
  const dispatch = useAppDispatch();
  const topbarCourseId = useSelectedCourseId();
  const effectiveCourseId = courseId ?? topbarCourseId ?? undefined;
  const weightTotal = useAppSelector(selectActivityWeightTotal);

  const [name, setName] = useState(activity?.name ?? "");
  const [weightPercent, setWeightPercent] = useState(activity ? String(activity.weightPercent) : "");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(activity);
  const parsedWeight = Number(weightPercent);
  const safeWeight = Number.isFinite(parsedWeight) ? parsedWeight : 0;
  const otherActivitiesTotal = weightTotal - (activity?.weightPercent ?? 0);
  const projectedTotal = otherActivitiesTotal + safeWeight;
  const overLimit = projectedTotal > 100;

  function handleClose() {
    setName("");
    setWeightPercent("");
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!effectiveCourseId || !name || !weightPercent) return;

    setSubmitting(true);
    try {
      if (activity) {
        await dispatch(
          updateActivity({ courseId: effectiveCourseId, activityId: activity.id, input: { name, weightPercent: parsedWeight } }),
        ).unwrap();
        toast.success(`${name} updated.`);
      } else {
        await dispatch(createActivity({ courseId: effectiveCourseId, input: { name, weightPercent: parsedWeight } })).unwrap();
        toast.success(`${name} added — weights now total ${projectedTotal.toFixed(2)}%.`);
      }
      handleClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not save activity.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ width: "400px" }}>
        <DialogTitle>{isEdit ? "Edit Activity" : "Add Activity"}</DialogTitle>
        <DialogContent>Course weights must never exceed 100% in total.</DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <FormControl required>
              <FormLabel sx={labelSx}>Activity Name</FormLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Tactical Exercise Without Troops"
                required
              />
            </FormControl>
            <FormControl required error={overLimit}>
              <FormLabel sx={labelSx}>Weight %</FormLabel>
              <Input
                type="number"
                slotProps={{ input: { min: 0, max: 100, step: "0.01" } }}
                value={weightPercent}
                onChange={(event) => setWeightPercent(event.target.value)}
                required
              />
              <FormHelperText sx={{ color: overLimit ? "var(--color-error)" : "var(--color-text-muted)" }}>
                Would total {projectedTotal.toFixed(2)}% across the course.
              </FormHelperText>
            </FormControl>
            <Button type="submit" loading={submitting} color="primary" disabled={!effectiveCourseId || overLimit}>
              {isEdit ? "Save Changes" : "Add Activity"}
            </Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
