import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LandGroupName, PlagiarismHighlight, PlagiarismSource, PlagiarismStatus, Submission } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiPlagiarismSource =
  | { type: "internal"; submission_id: string; officer_name: string; army_number: string }
  | { type: "external"; url: string; title: string; snippet: string };

type ApiSubmission = {
  id: string;
  assessment: string;
  activity_name: string;
  officer: string;
  officer_name: string;
  army_number: string;
  land_group: LandGroupName;
  file_type: "docx" | "pdf";
  file_url: string | null;
  submitted_at: string;
  is_late: boolean;
  plagiarism_status?: PlagiarismStatus | null;
  plagiarism_score?: number | null;
  plagiarism_highlights?: { text: string; band: PlagiarismHighlight["band"]; similarity_percent: number; source: ApiPlagiarismSource | null }[];
  plagiarism_external_checked?: boolean;
  plagiarism_checked_at?: string | null;
};

function mapSource(source: ApiPlagiarismSource | null): PlagiarismSource | null {
  if (!source) return null;
  if (source.type === "internal") {
    return { type: "internal", submissionId: source.submission_id, officerName: source.officer_name, armyNumber: source.army_number };
  }
  return { type: "external", url: source.url, title: source.title, snippet: source.snippet };
}

function mapHighlights(highlights?: ApiSubmission["plagiarism_highlights"]): PlagiarismHighlight[] | undefined {
  return highlights?.map((h) => ({
    text: h.text,
    band: h.band,
    similarityPercent: h.similarity_percent,
    source: mapSource(h.source),
  }));
}

function mapApiSubmission(api: ApiSubmission): Submission {
  return {
    id: api.id,
    assessmentId: api.assessment,
    activityName: api.activity_name,
    officerId: api.officer,
    officerName: api.officer_name,
    armyNumber: api.army_number,
    landGroup: api.land_group,
    fileType: api.file_type,
    fileUrl: api.file_url,
    submittedAt: api.submitted_at,
    isLate: api.is_late,
    plagiarismStatus: api.plagiarism_status ?? undefined,
    plagiarismScore: api.plagiarism_score ?? undefined,
    plagiarismHighlights: mapHighlights(api.plagiarism_highlights),
    plagiarismExternalChecked: api.plagiarism_external_checked ?? undefined,
    plagiarismCheckedAt: api.plagiarism_checked_at ?? undefined,
  };
}

type SubmissionsState = {
  courseId: string | null;
  items: Submission[];
  status: "idle" | "loading" | "succeeded" | "failed";
  uploadStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: SubmissionsState = {
  courseId: null,
  items: [],
  status: "idle",
  uploadStatus: "idle",
  error: null,
};

export const fetchSubmissions = createAsyncThunk("submissions/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiSubmission>(endpoints.submissions(courseId));
  return { courseId, items: results.map(mapApiSubmission) };
});

export const submitAssessmentFile = createAsyncThunk<
  Submission,
  { courseId: string; assessmentId: string; file: File },
  { rejectValue: string }
>("submissions/upload", async ({ courseId, assessmentId, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("assessment", assessmentId);
    formData.append("file", file);
    // No explicit Content-Type here — the browser sets multipart/form-data
    // with the correct boundary automatically for a FormData body; setting
    // it manually would strip the boundary and break server-side parsing.
    const { data } = await apiClient.post<ApiSubmission>(endpoints.submissions(courseId), formData);
    return mapApiSubmission(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not submit file."));
  }
});

// DS-triggered only — see MarkingRow. Not automatic on upload. Safe to call
// again on an already-checked submission (re-runs, overwriting the report).
export const checkPlagiarism = createAsyncThunk<
  Submission,
  { courseId: string; submissionId: string },
  { rejectValue: string }
>("submissions/checkPlagiarism", async ({ courseId, submissionId }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<ApiSubmission>(endpoints.checkPlagiarism(courseId, submissionId));
    return mapApiSubmission(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not run the plagiarism check."));
  }
});

const submissionsSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchSubmissions.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load submissions.";
      })
      .addCase(submitAssessmentFile.pending, (state) => {
        state.uploadStatus = "loading";
      })
      .addCase(submitAssessmentFile.fulfilled, (state, action: PayloadAction<Submission>) => {
        state.uploadStatus = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(submitAssessmentFile.rejected, (state) => {
        state.uploadStatus = "failed";
      })
      .addCase(checkPlagiarism.fulfilled, (state, action: PayloadAction<Submission>) => {
        const index = state.items.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default submissionsSlice.reducer;

export const selectSubmissions = (state: RootState) => state.submissions.items;
export const selectSubmissionsStatus = (state: RootState) => state.submissions.status;
export const selectUploadStatus = (state: RootState) => state.submissions.uploadStatus;
// officerId narrows to one officer's row (DS marking screen, where the list
// holds every officer's submission); omitted, it just matches the
// assessment (Officer's own detail page, where the list is already scoped
// server-side to their own submissions only).
export const selectSubmissionForAssessment = (assessmentId: string, officerId?: string) => (state: RootState) =>
  state.submissions.items.find(
    (s) => s.assessmentId === assessmentId && (officerId === undefined || s.officerId === officerId),
  ) ?? null;
