import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { mapApiUser } from "@/lib/apiMappers";
import { extractApiError } from "@/lib/utils";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  // Whether the app has finished trying to rebuild a session from the
  // httpOnly refresh cookie on load — RequireAuth waits for this to settle
  // before redirecting to /login, since accessToken lives in Redux memory
  // only and a hard reload/reopen starts with nothing but the cookie.
  bootstrapStatus: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
  error: null,
  bootstrapStatus: "idle",
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { armyNumber: string; password: string }) => {
    const { data } = await apiClient.post(endpoints.login, {
      army_number: credentials.armyNumber,
      password: credentials.password,
    });
    return { user: mapApiUser(data.user), accessToken: data.access as string };
  },
);

// Called once on app mount — attempts to rebuild the session purely from the
// httpOnly refresh cookie (no body/localStorage involved). A rejection here
// is the normal case for a logged-out visitor, not an error to surface.
export const bootstrapSession = createAsyncThunk("auth/bootstrap", async (_: void, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post(endpoints.refresh);
    return { user: mapApiUser(data.user), accessToken: data.access as string };
  } catch {
    return rejectWithValue(null);
  }
});

export const uploadAvatar = createAsyncThunk<User, File, { rejectValue: string }>(
  "auth/uploadAvatar",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      // No explicit Content-Type — the browser sets multipart/form-data with
      // the correct boundary automatically for a FormData body.
      const { data } = await apiClient.post(endpoints.updateAvatar, formData);
      return mapApiUser(data);
    } catch (error) {
      return rejectWithValue(extractApiError(error, "Could not update your photo."));
    }
  },
);

export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>("auth/changePassword", async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    await apiClient.post(endpoints.changePassword, { current_password: currentPassword, new_password: newPassword });
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not change your password."));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    clearSession(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state) => {
        state.status = "failed";
        state.error = "Army number or password is incorrect.";
      })
      .addCase(bootstrapSession.pending, (state) => {
        state.bootstrapStatus = "loading";
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.bootstrapStatus = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.bootstrapStatus = "failed";
      })
      .addCase(uploadAvatar.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(changePassword.fulfilled, (state) => {
        if (state.user) state.user.mustChangePassword = false;
      });
  },
});

export const { setSession, setAccessToken, clearSession } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.user !== null;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectBootstrapStatus = (state: RootState) => state.auth.bootstrapStatus;
