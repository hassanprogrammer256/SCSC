import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import Button from "@mui/joy/Button";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Stack from "@mui/joy/Stack";
import { PersonnelIdentityFields } from "@/features/personnel/PersonnelIdentityFields";
import { registerOfficer } from "@/features/personnel/officersSlice";
import { selectCourseById } from "@/features/courses/coursesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { RegisterPersonnelInput } from "@/types";

const EMPTY_INPUT: RegisterPersonnelInput = { armyNumber: "", rank: "", fullName: "", country: "", phoneNumber: "", email: "" };

type Props = {
  open: boolean;
  onClose: () => void;
  // Fixed when opened from a course's own Officers tab; falls back to the
  // topbar-selected course when opened from the global registry page — see
  // context/build-plan.md Phase 2 /architect notes (Decision 4).
  courseId?: string;
};

export function RegisterOfficerModal({ open, onClose, courseId }: Props) {
  const dispatch = useAppDispatch();
  const topbarCourseId = useSelectedCourseId();
  const effectiveCourseId = courseId ?? topbarCourseId ?? undefined;
  const course = useAppSelector(selectCourseById(effectiveCourseId));

  const [input, setInput] = useState<RegisterPersonnelInput>(EMPTY_INPUT);
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setInput(EMPTY_INPUT);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!effectiveCourseId || !input.landGroupId) return;

    setSubmitting(true);
    try {
      const result = await dispatch(registerOfficer({ courseId: effectiveCourseId, input })).unwrap();
      toast.success(
        `${result.profile.user.fullName} registered — initial password ${result.initialPassword}. Relay it to the officer (SMS/email delivery arrives in Phase 7).`,
      );
      handleClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not register officer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ width: "440px" }}>
        <DialogTitle>Register Officer</DialogTitle>
        <DialogContent>
          {course ? `Registering into ${course.code}.` : "Select a course from the topbar first."}
        </DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <PersonnelIdentityFields value={input} onChange={setInput} />
            <FormControl required>
              <FormLabel sx={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Land Group</FormLabel>
              <Select
                placeholder="Select Land Group"
                value={input.landGroupId ?? null}
                onChange={(_, value) => value && setInput((prev) => ({ ...prev, landGroupId: value }))}
              >
                {course?.landGroups.map((group) => (
                  <Option key={group.id} value={group.id}>
                    {group.name === "red" ? "Red Land" : "Blue Land"}
                  </Option>
                ))}
              </Select>
            </FormControl>
            <Button type="submit" loading={submitting} color="primary" disabled={!effectiveCourseId}>
              Register Officer
            </Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
