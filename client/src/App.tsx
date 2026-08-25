import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import CircularProgress from "@mui/joy/CircularProgress";
import { AppRouter } from "@/app/router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { bootstrapSession, selectBootstrapStatus } from "@/features/auth/authSlice";

function App() {
  const dispatch = useAppDispatch();
  const bootstrapStatus = useAppSelector(selectBootstrapStatus);

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  // Waits for the one-time session-rebuild-from-cookie attempt to settle
  // before rendering any route — otherwise RequireAuth would redirect to
  // /login on every hard reload before the refresh cookie gets a chance.
  if (bootstrapStatus === "idle" || bootstrapStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <CircularProgress size="md" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
