import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { UserCog } from "lucide-react";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import DialogActions from "@mui/joy/DialogActions";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip } from "@/components/common/StatusChip";
import { fetchUsers, resetUserPassword, selectUsers, selectUsersStatus, setUserActive } from "@/features/admin/usersSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";

const tableSx = {
  "--TableCell-paddingY": "10px",
  "--TableCell-paddingX": "12px",
  "& thead th": { fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" as const },
  "& tbody td": { fontSize: "14px", color: "var(--color-text-primary)" },
  "& tbody tr:hover": { backgroundColor: "var(--color-surface-secondary)" },
};

const roleLabel: Record<User["role"], string> = { admin: "Admin", directing_staff: "Directing Staff", officer: "Officer" };

// Admin-only /admin/users — build-plan.md Phase 8 feature 32. Every action
// (reset password, deactivate/reactivate) is logged server-side
// (accounts.UserActionLog: actor, target, timestamp) — nothing to render
// for that here, it's an audit trail, not a user-facing feature.
export function UsersPage() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const status = useAppSelector(selectUsersStatus);
  const [pendingDeactivate, setPendingDeactivate] = useState<User | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  async function handleResetPassword(user: User) {
    setResetting(user.id);
    try {
      const result = await dispatch(resetUserPassword({ userId: user.id, armyNumber: user.armyNumber })).unwrap();
      toast.success(`${user.fullName} — new password ${result.initialPassword}. Relay it to them (they'll be forced to change it on next login).`);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not reset password.");
    } finally {
      setResetting(null);
    }
  }

  async function handleToggleActive(user: User) {
    setTogglingId(user.id);
    try {
      await dispatch(setUserActive({ userId: user.id, active: !user.isActive })).unwrap();
      toast.success(`${user.fullName} — account ${user.isActive ? "deactivated" : "reactivated"}.`);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Could not update account status.");
    } finally {
      setTogglingId(null);
      setPendingDeactivate(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography level="h3" sx={{ color: "var(--color-text-primary)", fontSize: "22px", fontWeight: 700 }}>
        User Management
      </Typography>

      {status === "loading" && users.length === 0 ? (
        <div className="flex justify-center py-16">
          <CircularProgress size="md" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <EmptyState icon={UserCog} title="No users yet" />
        </Card>
      ) : (
        <Card>
          <Table sx={tableSx}>
            <thead>
              <tr>
                <th>Army Number</th>
                <th>Name</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Status</th>
                <th style={{ width: "220px" }} />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{user.armyNumber}</td>
                  <td>
                    {user.rank} {user.fullName}
                  </td>
                  <td>{roleLabel[user.role]}</td>
                  <td>{user.createdAt ? formatDate(user.createdAt) : "—"}</td>
                  <td>
                    <StatusChip label={user.isActive ? "Active" : "Deactivated"} tone={user.isActive ? "success" : "error"} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outlined"
                        color="neutral"
                        loading={resetting === user.id}
                        onClick={() => handleResetPassword(user)}
                      >
                        Reset Password
                      </Button>
                      {user.isActive ? (
                        <Button size="sm" variant="outlined" color="danger" onClick={() => setPendingDeactivate(user)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button size="sm" variant="outlined" color="success" loading={togglingId === user.id} onClick={() => handleToggleActive(user)}>
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal open={Boolean(pendingDeactivate)} onClose={() => setPendingDeactivate(null)}>
        <ModalDialog role="alertdialog">
          <DialogTitle>Deactivate Account?</DialogTitle>
          <DialogContent>
            {pendingDeactivate ? `${pendingDeactivate.fullName} (${pendingDeactivate.armyNumber}) will no longer be able to sign in.` : null}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="neutral" onClick={() => setPendingDeactivate(null)}>
              Cancel
            </Button>
            <Button color="danger" loading={togglingId === pendingDeactivate?.id} onClick={() => pendingDeactivate && handleToggleActive(pendingDeactivate)}>
              Deactivate
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </div>
  );
}
