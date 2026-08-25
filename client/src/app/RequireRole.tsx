import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "@/types";
import { useAppSelector } from "@/app/hooks";
import { roleHomePath } from "@/app/navConfig";
import { selectCurrentUser } from "@/features/auth/authSlice";

type Props = {
  role: Role;
};

// Redirects to the user's own dashboard on a role mismatch — never renders a
// blank page or throws. See context/library-docs.md → react-router-dom.
export function RequireRole({ role }: Props) {
  const user = useAppSelector(selectCurrentUser);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={roleHomePath[user.role]} replace />;

  return <Outlet />;
}
