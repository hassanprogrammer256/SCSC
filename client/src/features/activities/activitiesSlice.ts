import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Activity } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiActivity = {
  id: string;
  course: string;
  name: string;
  weight_percent: string;
  is_mandatory: boolean;
};

function mapApiActivity(apiActivity: ApiActivity): Activity {
  return {
    id: apiActivity.id,
    courseId: apiActivity.course,
    name: apiActivity.name,
    weightPercent: Number(apiActivity.weight_percent),
  };
}

type ActivityInput = { name: string; weightPercent: number };

type ActivitiesState = {
  courseId: string | null;
  items: Activity[];
  status: "idle" | "loading" | "succeeded" | "failed";
  saveStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: ActivitiesState = {
  courseId: null,
  items: [],
  status: "idle",
  saveStatus: "idle",
  error: null,
};

export const fetchActivities = createAsyncThunk("activities/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiActivity>(endpoints.activities(courseId));
  return { courseId, items: results.map(mapApiActivity) };
});

export const createActivity = createAsyncThunk<
  Activity,
  { courseId: string; input: ActivityInput },
  { rejectValue: string }
>("activities/create", async ({ courseId, input }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<ApiActivity>(endpoints.activities(courseId), {
      name: input.name,
      weight_percent: input.weightPercent,
    });
    return mapApiActivity(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not save activity."));
  }
});

export const updateActivity = createAsyncThunk<
  Activity,
  { courseId: string; activityId: string; input: ActivityInput },
  { rejectValue: string }
>("activities/update", async ({ courseId, activityId, input }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.patch<ApiActivity>(endpoints.activity(courseId, activityId), {
      name: input.name,
      weight_percent: input.weightPercent,
    });
    return mapApiActivity(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not save activity."));
  }
});

export const deleteActivity = createAsyncThunk<
  string,
  { courseId: string; activityId: string },
  { rejectValue: string }
>("activities/delete", async ({ courseId, activityId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(endpoints.activity(courseId, activityId));
    return activityId;
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not delete activity."));
  }
});

const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchActivities.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load activities.";
      })
      .addCase(createActivity.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(createActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
        state.saveStatus = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(createActivity.rejected, (state) => {
        state.saveStatus = "failed";
      })
      .addCase(updateActivity.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(updateActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
        state.saveStatus = "succeeded";
        const index = state.items.findIndex((activity) => activity.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateActivity.rejected, (state) => {
        state.saveStatus = "failed";
      })
      .addCase(deleteActivity.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((activity) => activity.id !== action.payload);
      });
  },
});

export default activitiesSlice.reducer;

export const selectActivities = (state: RootState) => state.activities.items;
export const selectActivitiesStatus = (state: RootState) => state.activities.status;
export const selectActivitiesCourseId = (state: RootState) => state.activities.courseId;
export const selectSaveActivityStatus = (state: RootState) => state.activities.saveStatus;
export const selectActivityById = (activityId: string | undefined) => (state: RootState) =>
  activityId ? (state.activities.items.find((activity) => activity.id === activityId) ?? null) : null;
export const selectActivityWeightTotal = (state: RootState) =>
  state.activities.items.reduce((sum, activity) => sum + activity.weightPercent, 0);
