import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import DialogActions from "@mui/joy/DialogActions";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import IconButton from "@mui/joy/IconButton";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { WeightTotalBadge } from "@/components/common/WeightTotalBadge";
import { ActivityFormModal } from "@/features/activities/ActivityFormModal";
import {
  deleteActivity,
  fetchActivities,
  selectActivities,
  selectActivitiesStatus,
  selectActivityWeightTotal,
} from "@/features/activities/activitiesSlice";
import { useSelectedCourseId } from "@/app/useSelectedCourse";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { Activity } from "@/types";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

type Props = {
  // Fixed when rendered inside a course's own Activities tab; falls back to
  // the topbar-selected course on the global /admin/activities page.
  courseId?: string;
};

export function ActivitiesPage({ courseId: courseIdProp }: Props = {}) {
  const dispatch = useAppDispatch();
  const topbarCourseId = useSelectedCourseId();
  const courseId = courseIdProp ?? topbarCourseId;
  const activities = useAppSelector(selectActivities);
  const status = useAppSelector(selectActivitiesStatus);
  const weightTotal = useAppSelector(selectActivityWeightTotal);

  const [formActivity, setFormActivity] = useState<Activity | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (courseId) dispatch(fetchActivities(courseId));
  }, [dispatch, courseId]);

  async function handleConfirmDelete() {
    if (!courseId || !pendingDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteActivity({ courseId, activityId: pendingDelete.id })).unwrap();
      toast.success(`${pendingDelete.name} removed.`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not delete activity.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
            Activities
          </Typography>
          {activities.length > 0 ? <WeightTotalBadge total={weightTotal} /> : null}
        </div>
        <Button startDecorator={<Plus size={16} />} color="primary" onClick={() => setFormActivity(null)} disabled={!courseId}>
          Add Activity
        </Button>
      </div>

      {!courseId ? (
        <Card>
          <EmptyState icon={ClipboardList} title="Select a course" description="Choose a course from the topbar to view its activities." />
        </Card>
      ) : status === "loading" && activities.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No activities defined yet"
            description="Add the first activity for this course."
            action={
              <Button size="sm" color="primary" onClick={() => setFormActivity(null)}>
                Add Activity
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ textAlign: "right" }}>Weight %</th>
                <th style={{ width: "88px" }} />
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.name}</td>
                  <td style={{ textAlign: "right" }}>{activity.weightPercent}%</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton size="sm" variant="plain" color="neutral" aria-label="Edit activity" onClick={() => setFormActivity(activity)}>
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton size="sm" variant="plain" color="danger" aria-label="Delete activity" onClick={() => setPendingDelete(activity)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {formActivity !== undefined ? (
        <ActivityFormModal
          key={formActivity?.id ?? "new"}
          open
          onClose={() => setFormActivity(undefined)}
          courseId={courseId ?? undefined}
          activity={formActivity}
        />
      ) : null}

      <Modal open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <ModalDialog role="alertdialog">
          <DialogTitle>Delete Activity?</DialogTitle>
          <DialogContent>
            {pendingDelete
              ? `"${pendingDelete.name}" (${pendingDelete.weightPercent}%) will be removed, along with any Directing Staff assignments for it. This cannot be undone.`
              : null}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="neutral" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button color="danger" loading={deleting} onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </div>
  );
}
