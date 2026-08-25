import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { GradeBand, OfficerActivityResult, OfficerProgress } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type ApiActivityResult = {
  activity_id: string;
  activity_name: string;
  weight_percent: number;
  score: number | null;
  grade: GradeBand | null;
  is_complete: boolean;
  remarks: string | null;
  comments: string | null;
};

type ApiOfficerProgress = {
  activities: ApiActivityResult[];
  progress_percent: number;
  weighted_average: number | null;
  degree_class: GradeBand | null;
};

function mapApiProgress(api: ApiOfficerProgress): OfficerProgress {
  return {
    activities: api.activities.map(
      (a): OfficerActivityResult => ({
        activityId: a.activity_id,
        activityName: a.activity_name,
        weightPercent: a.weight_percent,
        score: a.score,
        grade: a.grade,
        isComplete: a.is_complete,
        remarks: a.remarks,
        comments: a.comments,
      }),
    ),
    progressPercent: api.progress_percent,
    weightedAverage: api.weighted_average,
    degreeClass: api.degree_class,
  };
}

type OfficerProgressState = {
  data: OfficerProgress | null;
  status: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: OfficerProgressState = { data: null, status: "idle" };

export const fetchOfficerProgress = createAsyncThunk(
  "officerProgress/fetch",
  async ({ courseId, officerId }: { courseId: string; officerId: string }) => {
    const { data } = await apiClient.get<ApiOfficerProgress>(endpoints.officerProgress(courseId, officerId));
    return mapApiProgress(data);
  },
);

const officerProgressSlice = createSlice({
  name: "officerProgress",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOfficerProgress.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOfficerProgress.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchOfficerProgress.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default officerProgressSlice.reducer;

export const selectOfficerProgress = (state: RootState) => state.officerProgress.data;
export const selectOfficerProgressStatus = (state: RootState) => state.officerProgress.status;
