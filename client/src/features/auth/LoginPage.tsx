import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Typography from "@mui/joy/Typography";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { login, selectAuthStatus } from "@/features/auth/authSlice";
import { roleHomePath } from "@/app/navConfig";
import { demoUsers } from "@/lib/mocks/users";

const DEMO_PASSWORD = "Passw0rd!";

// Real POST /api/auth/login/ — see accounts/views.py on the backend. The demo
// army numbers below are seeded by `python manage.py seed_demo_users`, all
// sharing DEMO_PASSWORD, and skip the forced password-change redirect (see
// context/progress-tracker.md decisions log).
export function LoginPage() {
  const [armyNumber, setArmyNumber] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector(selectAuthStatus);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      const { user } = await dispatch(login({ armyNumber, password })).unwrap();
      navigate(roleHomePath[user.role]);
    } catch {
      toast.error("Army number or password is incorrect.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-100 flex-col gap-6 rounded-2xl border border-border bg-surface p-8 shadow-[0px_1px_3px_rgba(19,34,61,0.08),0px_1px_2px_rgba(19,34,61,0.06)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/scsc-logo.jpg" alt="SCSC crest" className="h-20 w-20 object-cover" />
          <div>
            <Typography level="h4" sx={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
              Senior Command and Staff College
            </Typography>
            <Typography level="body-sm" sx={{ color: "var(--color-text-muted)" }}>
              Jinja — Kimaka, Uganda
            </Typography>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Army Number</FormLabel>
            <Input
              value={armyNumber}
              onChange={(event) => setArmyNumber(event.target.value)}
              placeholder="e.g. UPDF-A1002"
              sx={{ fontFamily: "var(--font-mono)" }}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </FormControl>
          <Button
            type="submit"
            loading={status === "loading"}
            sx={{
              mt: 1,
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              "&:hover": { backgroundColor: "var(--color-primary-dark)" },
            }}
          >
            Sign In
          </Button>
        </form>

        <div className="rounded-lg bg-surface-secondary p-3">
          <Typography level="body-xs" sx={{ color: "var(--color-text-muted)", fontWeight: 600, mb: 1 }}>
            PREVIEW — DEMO ACCOUNTS (password: {DEMO_PASSWORD})
          </Typography>
          {Object.values(demoUsers).map((user) => (
            <Typography key={user.id} level="body-xs" sx={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
              {user.armyNumber} — {user.role === "directing_staff" ? "Directing Staff" : user.role}
            </Typography>
          ))}
        </div>
      </div>
    </div>
  );
}
