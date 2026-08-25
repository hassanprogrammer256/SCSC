import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import Divider from "@mui/joy/Divider";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import type { PlagiarismHighlight, Submission } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  submission: Submission;
};

const BAND_STYLE: Record<string, { bg: string; border: string } | null> = {
  plagiarised: { bg: "var(--color-error-light)", border: "var(--color-error)" },
  paraphrased: { bg: "var(--color-warning-light)", border: "var(--color-warning)" },
  original: null,
};

function sourceLabel(highlight: PlagiarismHighlight): string {
  if (!highlight.source) return "";
  if (highlight.source.type === "internal") {
    return `${highlight.similarityPercent}% match — ${highlight.source.officerName} (${highlight.source.armyNumber})`;
  }
  return `${highlight.similarityPercent}% match — ${highlight.source.title}`;
}

function legendSwatch(color: string, border: string, label: string) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{ width: "14px", height: "14px", borderRadius: "var(--radius-sm)", backgroundColor: color, border: `2px solid ${border}` }}
      />
      <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
        {label}
      </Typography>
    </div>
  );
}

// DS-only — mounted from MarkingRow once a submission has a completed
// PlagiarismReport. Renders the full submission text with each sentence
// colored by band (plagiarised/paraphrased/original — original is plain
// text, no highlight) and, for a flagged sentence, a hover tooltip naming
// its source: another officer's submission (internal), or an external URL
// (a clickable link to go verify). See context/ui-tokens.md → Plagiarism
// Highlighting.
export function PlagiarismReportModal({ open, onClose, submission }: Props) {
  const highlights = submission.plagiarismHighlights ?? [];

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ maxWidth: "720px", width: "100%", maxHeight: "85vh", overflow: "hidden" }}>
        <DialogTitle>
          Plagiarism Report — {submission.officerName} ({submission.armyNumber})
        </DialogTitle>
        <DialogContent sx={{ overflow: "auto" }}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                Overall: {submission.plagiarismScore ?? 0}% flagged
              </Typography>
              <Typography level="body-xs" sx={{ color: "var(--color-text-muted)" }}>
                Web sources: {submission.plagiarismExternalChecked ? "checked" : "not checked (daily limit reached, or not configured)"}
              </Typography>
            </div>

            <div className="flex items-center gap-4">
              {legendSwatch("var(--color-error-light)", "var(--color-error)", "Plagiarised")}
              {legendSwatch("var(--color-warning-light)", "var(--color-warning)", "Paraphrased")}
            </div>

            <Divider />

            {highlights.length === 0 ? (
              <Typography level="body-sm" sx={{ color: "var(--color-text-muted)" }}>
                No text could be extracted from this submission.
              </Typography>
            ) : (
              <Typography level="body-sm" sx={{ color: "var(--color-text-primary)", lineHeight: 1.9 }}>
                {highlights.map((highlight, index) => {
                  const style = BAND_STYLE[highlight.band];
                  if (!style) {
                    return <span key={index}>{highlight.text} </span>;
                  }
                  const content = (
                    <span style={{ backgroundColor: style.bg, borderBottom: `2px solid ${style.border}` }}>{highlight.text} </span>
                  );
                  return (
                    <Tooltip key={index} title={sourceLabel(highlight)} variant="outlined" arrow>
                      {highlight.source?.type === "external" ? (
                        <a href={highlight.source.url} target="_blank" rel="noreferrer">
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </Tooltip>
                  );
                })}
              </Typography>
            )}
          </div>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
