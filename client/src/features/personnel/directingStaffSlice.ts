import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DirectingStaffProfile, RegisterPersonnelInput, RegistrationResult } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";
import { mapApiUser, type ApiUser } from "@/lib/apiMappers";

type ApiDirectingStaffProfile = {
  id: string;
  user: ApiUser;
  initial_password: string | null;
};

function mapApiDirectingStaffProfile(apiProfile: ApiDirectingStaffProfile): DirectingStaffProfile {
  return { id: apiProfile.id, user: mapApiUser(apiProfile.user) };
}

type DirectingStaffState = {
  courseId: string | null;
  items: DirectingStaffProfile[];
  // See officersSlice.ts's `mine` — same purpose for the DS role.
  mine: DirectingStaffProfile | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  registerStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: DirectingStaffState = {
  courseId: null,
  items: [],
  mine: null,
  status: "idle",
  registerStatus: "idle",
  error: null,
};

export const fetchDirectingStaff = createAsyncThunk("directingStaff/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiDirectingStaffProfile>(endpoints.directingStaff(courseId));
  return { courseId, items: results.map(mapApiDirectingStaffProfile) };
});

export const fetchMyDirectingStaffProfile = createAsyncThunk("directingStaff/fetchMine", async (courseId: string) => {
  const { data } = await apiClient.get<ApiDirectingStaffProfile>(endpoints.myDirectingStaffProfile(courseId));
  return mapApiDirectingStaffProfile(data);
});

export const registerDirectingStaff = createAsyncThunk<
  RegistrationResult<DirectingStaffProfile>,
  { courseId: string; input: RegisterPersonnelInput },
  { rejectValue: string }
>("directingStaff/register", async ({ courseId, input }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("army_number", input.armyNumber);
    formData.append("rank", input.rank);
    formData.append("full_name", input.fullName);
    formData.append("country", input.country);
    formData.append("phone_number", input.phoneNumber ?? "");
    formData.append("email", input.email ?? "");
    if (input.avatar) formData.append("avatar", input.avatar);
    // No explicit Content-Type — the browser sets multipart/form-data with
    // the correct boundary automatically for a FormData body.
    const { data } = await apiClient.post<ApiDirectingStaffProfile>(endpoints.directingStaff(courseId), formData);
    return { profile: mapApiDirectingStaffProfile(data), initialPassword: data.initial_password ?? "" };
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not register directing staff."));
  }
});

const directingStaffSlice = createSlice({
  name: "directingStaff",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDirectingStaff.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDirectingStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchDirectingStaff.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load directing staff.";
      })
      .addCase(registerDirectingStaff.pending, (state) => {
        state.registerStatus = "loading";
      })
      .addCase(registerDirectingStaff.fulfilled, (state, action: PayloadAction<RegistrationResult<DirectingStaffProfile>>) => {
        state.registerStatus = "succeeded";
        state.items.unshift(action.payload.profile);
      })
      .addCase(registerDirectingStaff.rejected, (state) => {
        state.registerStatus = "failed";
      })
      .addCase(fetchMyDirectingStaffProfile.fulfilled, (state, action: PayloadAction<DirectingStaffProfile>) => {
        state.mine = action.payload;
      });
  },
});

export default directingStaffSlice.reducer;

export const selectDirectingStaff = (state: RootState) => state.directingStaff.items;
export const selectDirectingStaffStatus = (state: RootState) => state.directingStaff.status;
export const selectDirectingStaffCourseId = (state: RootState) => state.directingStaff.courseId;
export const selectRegisterDirectingStaffStatus = (state: RootState) => state.directingStaff.registerStatus;
export const selectMyDirectingStaffProfile = (state: RootState) => state.directingStaff.mine;
