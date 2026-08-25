import { useState } from "react";
import { toast } from "react-toastify";
import { Download } from "lucide-react";
import Button from "@mui/joy/Button";
import Checkbox from "@mui/joy/Checkbox";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { PlagiarismChip } from "@/components/common/PlagiarismChip";
import { StatusChip } from "@/components/common/StatusChip";
import { PlagiarismReportModal } from "@/features/assessments/PlagiarismReportModal";
import { checkPlagiarism } from "@/features/assessments/submissionsSlice";
import { saveMark } from "@/features/assessments/marksSlice";
import { useAppDispatch } from "@/app/hooks";
import type { Mark, OfficerProfile, Submission } from "@/types";

type Props = {
  courseId: string;
  assessmentId: string;
  officer: OfficerProfile;
  submission: Submission | null;
  mark: Mark | null;
};

// One row of the DS Marking screen — Plagiarism badge renders before the
// score/remarks inputs so the DS sees it before marking, per ui-rules.md →
// Tables. This component only ever mounts inside DsMarkingPage (DS-only
// route), so it's safe for it to read plagiarism fields. Checking is
// DS-triggered (button here), never automatic — Admin has no visibility
// into plagiarism results at all.
export function MarkingRow({ courseId, assessmentId, officer, submission, mark }: Props) {
  const dispatch = useAppDispatch();
  const [score, setScore] = useState(mark ? String(mark.score) : "");
  const [remarks, setRemarks] = useState(mark?.remarks ?? "");
  const [comments, setComments] = useState(mark?.comments ?? "");
  const [isComplete, setIsComplete] = useState(mark?.isComplete ?? false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  async function handleCheckPlagiarism() {
    if (!submission) return;
    setChecking(true);
    try {
      await dispatch(checkPlagiarism({ courseId, submissionId: submission.id })).unwrap();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not run the plagiarism check.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSave() {
    const parsedScore = Number(score);
    if (!score || Number.isNaN(parsedScore)) {
      toast.error("Enter a score before saving.");
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        saveMark({
          courseId,
          existingId: mark?.id,
          input: { assessmentId, officerId: officer.id, score: parsedScore, remarks, comments, isComplete },
        }),
      ).unwrap();
      toast.success(`${officer.user.fullName} — mark saved.`);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not save mark.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
            {officer.user.rank} {officer.user.fullName}
          </Typography>
          <Typography level="body-xs" sx={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
            {officer.user.armyNumber}
          </Typography>
        </div>
        {submission ? (
          <div className="flex items-center gap-2">
            {submission.fileUrl ? (
              <Tooltip title="Download submitted file" variant="outlined">
                <IconButton
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  component="a"
                  href={submission.fileUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Download submitted file"
                >
                  <Download size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
            <PlagiarismChip status={submission.plagiarismStatus ?? "not_checked"} score={submission.plagiarismScore ?? null} />
            {submission.plagiarismStatus === "completed" ? (
              <Button size="sm" variant="plain" color="neutral" onClick={() => setReportOpen(true)}>
                View Report
              </Button>
            ) : null}
            <Button size="sm" variant="outlined" color="neutral" loading={checking} onClick={handleCheckPlagiarism}>
              {submission.plagiarismStatus === "completed" ? "Re-check" : "Run Plagiarism Check"}
            </Button>
          </div>
        ) : (
          <StatusChip label="Not Submitted" tone="warning" />
        )}
      </div>

      {submission && reportOpen ? (
        <PlagiarismReportModal open={reportOpen} onClose={() => setReportOpen(false)} submission={submission} />
      ) : null}

      {submission ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr_1fr_auto_auto] sm:items-start">
          <Input
            type="number"
            slotProps={{ input: { min: 0, max: 100, step: "0.01" } }}
            placeholder="Score %"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
          <Textarea minRows={1} placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <Textarea minRows={1} placeholder="Comments" value={comments} onChange={(e) => setComments(e.target.value)} />
          <Checkbox
            label="Approve Completion"
            checked={isComplete}
            onChange={(e) => setIsComplete(e.target.checked)}
            color="warning"
          />
          <Button size="sm" color="primary" loading={saving} onClick={handleSave}>
            {mark ? "Save" : "Mark"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
