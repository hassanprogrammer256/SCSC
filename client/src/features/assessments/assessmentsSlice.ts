import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AssessmentSchedule } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiAssessmentSchedule = {
  id: string;
  activity: string;
  activity_name: string;
  instructions: string;
  deadline: string;
};

function mapApiAssessment(apiAssessment: ApiAssessmentSchedule): AssessmentSchedule {
  return {
    id: apiAssessment.id,
    activityId: apiAssessment.activity,
    deadline: apiAssessment.deadline,
    instructions: apiAssessment.instructions,
  };
}

type AssessmentInput = { activityId: string; instructions: string; deadline: string };

type AssessmentsState = {
  courseId: string | null;
  items: AssessmentSchedule[];
  status: "idle" | "loading" | "succeeded" | "failed";
  saveStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: AssessmentsState = {
  courseId: null,
  items: [],
  status: "idle",
  saveStatus: "idle",
  error: null,
};

export const fetchAssessmentSchedules = createAsyncThunk("assessmentSchedules/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiAssessmentSchedule>(endpoints.assessments(courseId));
  return { courseId, items: results.map(mapApiAssessment) };
});

// Creates a new schedule, or PATCHes the existing one — AssessmentSchedule is
// one-to-one with Activity, so "Edit" on an already-scheduled activity must
// never attempt a second create (would 500 on the DB's unique constraint).
export const saveAssessmentSchedule = createAsyncThunk<
  AssessmentSchedule,
  { courseId: string; input: AssessmentInput; existingId?: string },
  { rejectValue: string }
>("assessmentSchedules/save", async ({ courseId, input, existingId }, { rejectWithValue }) => {
  try {
    const body = { activity: input.activityId, instructions: input.instructions, deadline: input.deadline };
    const { data } = existingId
      ? await apiClient.patch<ApiAssessmentSchedule>(endpoints.assessment(courseId, existingId), body)
      : await apiClient.post<ApiAssessmentSchedule>(endpoints.assessments(courseId), body);
    return mapApiAssessment(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not save assessment schedule."));
  }
});

const assessmentsSlice = createSlice({
  name: "assessmentSchedules",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessmentSchedules.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAssessmentSchedules.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchAssessmentSchedules.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load assessment schedules.";
      })
      .addCase(saveAssessmentSchedule.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(saveAssessmentSchedule.fulfilled, (state, action: PayloadAction<AssessmentSchedule>) => {
        state.saveStatus = "succeeded";
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(saveAssessmentSchedule.rejected, (state) => {
        state.saveStatus = "failed";
      });
  },
});

export default assessmentsSlice.reducer;

export const selectAssessmentSchedules = (state: RootState) => state.assessmentSchedules.items;
export const selectAssessmentSchedulesStatus = (state: RootState) => state.assessmentSchedules.status;
export const selectAssessmentScheduleForActivity = (activityId: string) => (state: RootState) =>
  state.assessmentSchedules.items.find((item) => item.activityId === activityId) ?? null;
