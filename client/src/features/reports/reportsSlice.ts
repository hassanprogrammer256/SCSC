import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DsAssessmentReport, GradeBand, LandGroupName, ProgressReportRow } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiProgressRow = {
  officer_id: string;
  army_number: string;
  full_name: string;
  land_group: LandGroupName;
  progress_percent: number;
  weighted_average: number | null;
  degree_class: GradeBand | null;
  outstanding_activities: string[];
};

function mapApiProgressRow(api: ApiProgressRow): ProgressReportRow {
  return {
    officerId: api.officer_id,
    armyNumber: api.army_number,
    fullName: api.full_name,
    landGroup: api.land_group,
    progressPercent: api.progress_percent,
    weightedAverage: api.weighted_average,
    degreeClass: api.degree_class,
    outstandingActivities: api.outstanding_activities,
  };
}

type ApiAssessmentReport = {
  id: string;
  assessment: string;
  activity_name: string;
  directing_staff_name: string;
  body: string;
  submitted_at: string;
};

function mapApiReport(api: ApiAssessmentReport): DsAssessmentReport {
  return {
    id: api.id,
    assessmentId: api.assessment,
    activityName: api.activity_name,
    directingStaffName: api.directing_staff_name,
    body: api.body,
    submittedAt: api.submitted_at,
  };
}

type ReportsState = {
  progressRows: ProgressReportRow[];
  progressStatus: "idle" | "loading" | "succeeded" | "failed";
  dsReports: DsAssessmentReport[];
  dsReportsStatus: "idle" | "loading" | "succeeded" | "failed";
  submitStatus: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: ReportsState = {
  progressRows: [],
  progressStatus: "idle",
  dsReports: [],
  dsReportsStatus: "idle",
  submitStatus: "idle",
};

export const fetchProgressReport = createAsyncThunk("reports/fetchProgress", async (courseId: string) => {
  const { data } = await apiClient.get<ApiProgressRow[]>(endpoints.progressReport(courseId));
  return data.map(mapApiProgressRow);
});

export const fetchAssessmentReports = createAsyncThunk("reports/fetchDsReports", async (courseId: string) => {
  const results = await fetchAllPages<ApiAssessmentReport>(endpoints.assessmentReports(courseId));
  return results.map(mapApiReport);
});

export const submitAssessmentReport = createAsyncThunk<
  DsAssessmentReport,
  { courseId: string; assessmentId: string; body: string },
  { rejectValue: string }
>("reports/submit", async ({ courseId, assessmentId, body }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<ApiAssessmentReport>(endpoints.assessmentReports(courseId), {
      assessment: assessmentId,
      body,
    });
    return mapApiReport(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not submit report."));
  }
});

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgressReport.pending, (state) => {
        state.progressStatus = "loading";
      })
      .addCase(fetchProgressReport.fulfilled, (state, action: PayloadAction<ProgressReportRow[]>) => {
        state.progressStatus = "succeeded";
        state.progressRows = action.payload;
      })
      .addCase(fetchProgressReport.rejected, (state) => {
        state.progressStatus = "failed";
      })
      .addCase(fetchAssessmentReports.pending, (state) => {
        state.dsReportsStatus = "loading";
      })
      .addCase(fetchAssessmentReports.fulfilled, (state, action: PayloadAction<DsAssessmentReport[]>) => {
        state.dsReportsStatus = "succeeded";
        state.dsReports = action.payload;
      })
      .addCase(fetchAssessmentReports.rejected, (state) => {
        state.dsReportsStatus = "failed";
      })
      .addCase(submitAssessmentReport.pending, (state) => {
        state.submitStatus = "loading";
      })
      .addCase(submitAssessmentReport.fulfilled, (state, action: PayloadAction<DsAssessmentReport>) => {
        state.submitStatus = "succeeded";
        state.dsReports.unshift(action.payload);
      })
      .addCase(submitAssessmentReport.rejected, (state) => {
        state.submitStatus = "failed";
      });
  },
});

export default reportsSlice.reducer;

export const selectProgressReport = (state: RootState) => state.reports.progressRows;
export const selectProgressReportStatus = (state: RootState) => state.reports.progressStatus;
export const selectDsReports = (state: RootState) => state.reports.dsReports;
export const selectDsReportsStatus = (state: RootState) => state.reports.dsReportsStatus;
export const selectSubmitReportStatus = (state: RootState) => state.reports.submitStatus;
