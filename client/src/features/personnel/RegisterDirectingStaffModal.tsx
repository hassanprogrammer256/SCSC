import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import Button from "@mui/joy/Button";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import { PersonnelIdentityFields } from "@/features/personnel/PersonnelIdentityFields";
import { registerDirectingStaff } from "@/features/personnel/directingStaffSlice";
import { selectCourseById } from "@/features/courses/coursesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { RegisterPersonnelInput } from "@/types";

const EMPTY_INPUT: RegisterPersonnelInput = { armyNumber: "", rank: "", fullName: "", country: "", phoneNumber: "", email: "" };

type Props = {
  open: boolean;
  onClose: () => void;
  courseId?: string;
};

export function RegisterDirectingStaffModal({ open, onClose, courseId }: Props) {
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
    if (!effectiveCourseId) return;

    setSubmitting(true);
    try {
      const result = await dispatch(registerDirectingStaff({ courseId: effectiveCourseId, input })).unwrap();
      toast.success(
        `${result.profile.user.fullName} registered — initial password ${result.initialPassword}. Relay it to the DS (SMS/email delivery arrives in Phase 7).`,
      );
      handleClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not register directing staff.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ width: "440px" }}>
        <DialogTitle>Register Directing Staff</DialogTitle>
        <DialogContent>
          {course ? `Registering into ${course.code}.` : "Select a course from the topbar first."}
        </DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <PersonnelIdentityFields value={input} onChange={setInput} />
            <Button type="submit" loading={submitting} color="primary" disabled={!effectiveCourseId}>
              Register Directing Staff
            </Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
