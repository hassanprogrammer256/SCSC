import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";
import { mapApiUser, type ApiUser } from "@/lib/apiMappers";

type ApiUserWithStatus = ApiUser & { is_active: boolean; created_at: string };

function mapApiUserWithStatus(api: ApiUserWithStatus): User {
  return { ...mapApiUser(api), isActive: api.is_active, createdAt: api.created_at };
}

type UsersState = {
  items: User[];
  status: "idle" | "loading" | "succeeded" | "failed";
  actionStatus: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: UsersState = { items: [], status: "idle", actionStatus: "idle" };

export const fetchUsers = createAsyncThunk("users/fetchAll", async () => {
  const results = await fetchAllPages<ApiUserWithStatus>(endpoints.users);
  return results.map(mapApiUserWithStatus);
});

export const resetUserPassword = createAsyncThunk<
  { userId: string; initialPassword: string },
  { userId: string; armyNumber: string },
  { rejectValue: string }
>("users/resetPassword", async ({ userId }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<{ initial_password: string }>(endpoints.resetPassword(userId));
    return { userId, initialPassword: data.initial_password };
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not reset password."));
  }
});

export const setUserActive = createAsyncThunk<
  User,
  { userId: string; active: boolean },
  { rejectValue: string }
>("users/setActive", async ({ userId, active }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<ApiUserWithStatus>(
      active ? endpoints.reactivateUser(userId) : endpoints.deactivateUser(userId),
    );
    return mapApiUserWithStatus(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not update account status."));
  }
});

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(resetUserPassword.pending, (state) => {
        state.actionStatus = "loading";
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.actionStatus = "succeeded";
      })
      .addCase(resetUserPassword.rejected, (state) => {
        state.actionStatus = "failed";
      })
      .addCase(setUserActive.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.items.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default usersSlice.reducer;

export const selectUsers = (state: RootState) => state.users.items;
export const selectUsersStatus = (state: RootState) => state.users.status;
