import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import Button from "@mui/joy/Button";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import { useAppDispatch } from "@/app/hooks";
import { createCourse } from "@/features/courses/coursesSlice";

function suggestCourseCode(today: Date = new Date()): string {
  const year = today.getFullYear();
  return `${year}/${String((year + 1) % 100).padStart(2, "0")}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateCourseModal({ open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const [code, setCode] = useState(suggestCourseCode);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const course = await dispatch(createCourse({ code })).unwrap();
      toast.success(`Course ${course.code} created — Red Land and Blue Land are ready.`);
      setCode(suggestCourseCode());
      onClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not create course.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: "400px" }}>
        <DialogTitle>Create Course</DialogTitle>
        <DialogContent>Red Land and Blue Land are created automatically.</DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <FormControl required>
              <FormLabel sx={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Course Code</FormLabel>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="e.g. 2026/27"
                sx={{ fontFamily: "var(--font-mono)" }}
                required
              />
              <FormHelperText sx={{ color: "var(--color-text-muted)" }}>
                Only one course may be active at a time.
              </FormHelperText>
            </FormControl>
            <Button type="submit" loading={submitting} color="primary">
              Create Course
            </Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
