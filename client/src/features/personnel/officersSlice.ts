import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LandGroupName, OfficerProfile, RegisterPersonnelInput, RegistrationResult } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";
import { mapApiUser, type ApiUser } from "@/lib/apiMappers";

type ApiOfficerProfile = {
  id: string;
  user: ApiUser;
  land_group: string;
  land_group_name: LandGroupName;
  initial_password: string | null;
};

function mapApiOfficerProfile(apiProfile: ApiOfficerProfile): OfficerProfile {
  return { id: apiProfile.id, user: mapApiUser(apiProfile.user), landGroup: apiProfile.land_group_name };
}

type OfficersState = {
  courseId: string | null;
  items: OfficerProfile[];
  // The signed-in user's own profile on the active course — populated by
  // fetchMyOfficerProfile, used by the Officer-role screens (submissions,
  // marking-adjacent reads, progress) which can't call the Admin-only list
  // endpoint. Never derived from `items`, which stays empty for Officer role.
  mine: OfficerProfile | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  registerStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: OfficersState = {
  courseId: null,
  items: [],
  mine: null,
  status: "idle",
  registerStatus: "idle",
  error: null,
};

export const fetchOfficers = createAsyncThunk("officers/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiOfficerProfile>(endpoints.officers(courseId));
  return { courseId, items: results.map(mapApiOfficerProfile) };
});

export const fetchMyOfficerProfile = createAsyncThunk("officers/fetchMine", async (courseId: string) => {
  const { data } = await apiClient.get<ApiOfficerProfile>(endpoints.myOfficerProfile(courseId));
  return mapApiOfficerProfile(data);
});

export const registerOfficer = createAsyncThunk<
  RegistrationResult<OfficerProfile>,
  { courseId: string; input: RegisterPersonnelInput },
  { rejectValue: string }
>("officers/register", async ({ courseId, input }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("army_number", input.armyNumber);
    formData.append("rank", input.rank);
    formData.append("full_name", input.fullName);
    formData.append("country", input.country);
    formData.append("phone_number", input.phoneNumber ?? "");
    formData.append("email", input.email ?? "");
    if (input.landGroupId) formData.append("land_group", input.landGroupId);
    if (input.avatar) formData.append("avatar", input.avatar);
    // No explicit Content-Type — the browser sets multipart/form-data with
    // the correct boundary automatically for a FormData body.
    const { data } = await apiClient.post<ApiOfficerProfile>(endpoints.officers(courseId), formData);
    return { profile: mapApiOfficerProfile(data), initialPassword: data.initial_password ?? "" };
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not register officer."));
  }
});

const officersSlice = createSlice({
  name: "officers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOfficers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchOfficers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchOfficers.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load officers.";
      })
      .addCase(registerOfficer.pending, (state) => {
        state.registerStatus = "loading";
      })
      .addCase(registerOfficer.fulfilled, (state, action: PayloadAction<RegistrationResult<OfficerProfile>>) => {
        state.registerStatus = "succeeded";
        state.items.unshift(action.payload.profile);
      })
      .addCase(registerOfficer.rejected, (state) => {
        state.registerStatus = "failed";
      })
      .addCase(fetchMyOfficerProfile.fulfilled, (state, action: PayloadAction<OfficerProfile>) => {
        state.mine = action.payload;
      });
  },
});

export default officersSlice.reducer;

export const selectOfficers = (state: RootState) => state.officers.items;
export const selectOfficersStatus = (state: RootState) => state.officers.status;
export const selectOfficersCourseId = (state: RootState) => state.officers.courseId;
export const selectRegisterOfficerStatus = (state: RootState) => state.officers.registerStatus;
export const selectMyOfficerProfile = (state: RootState) => state.officers.mine;
