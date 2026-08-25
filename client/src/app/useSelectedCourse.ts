import { useOutletContext } from "react-router-dom";
import type { AppShellContext } from "@/components/layout/AppShell";

// Global registry pages (Officers, Directing Staff, Land Groups) read the
// topbar's selected course through this instead of duplicating course-select
// state — see context/build-plan.md Phase 2 /architect notes.
export function useSelectedCourseId(): string | null {
  return useOutletContext<AppShellContext>().selectedCourseId;
}
