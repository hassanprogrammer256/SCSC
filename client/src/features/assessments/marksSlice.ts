import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GradeBand, Mark } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiMark = {
  id: string;
  assessment: string;
  activity_name: string;
  officer: string;
  officer_name: string;
  army_number: string;
  score: string;
  remarks: string;
  comments: string;
  is_complete: boolean;
  marked_at: string;
  grade: GradeBand;
};

function mapApiMark(api: ApiMark): Mark {
  return {
    id: api.id,
    assessmentId: api.assessment,
    activityName: api.activity_name,
    officerId: api.officer,
    officerName: api.officer_name,
    armyNumber: api.army_number,
    score: Number(api.score),
    remarks: api.remarks,
    comments: api.comments,
    isComplete: api.is_complete,
    grade: api.grade,
    markedAt: api.marked_at,
  };
}

type MarkInput = { assessmentId: string; officerId: string; score: number; remarks: string; comments: string; isComplete: boolean };

type MarksState = {
  courseId: string | null;
  items: Mark[];
  status: "idle" | "loading" | "succeeded" | "failed";
  saveStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: MarksState = {
  courseId: null,
  items: [],
  status: "idle",
  saveStatus: "idle",
  error: null,
};

export const fetchMarks = createAsyncThunk("marks/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiMark>(endpoints.marks(courseId));
  return { courseId, items: results.map(mapApiMark) };
});

function toBody(input: MarkInput) {
  return {
    assessment: input.assessmentId,
    officer: input.officerId,
    score: input.score,
    remarks: input.remarks,
    comments: input.comments,
    is_complete: input.isComplete,
  };
}

// Creates a new Mark, or PATCHes the existing one — Mark is unique_together
// (assessment, officer), so a DS revising a score before/after marking it
// complete must update in place, never attempt a second create.
export const saveMark = createAsyncThunk<
  Mark,
  { courseId: string; input: MarkInput; existingId?: string },
  { rejectValue: string }
>("marks/save", async ({ courseId, input, existingId }, { rejectWithValue }) => {
  try {
    const { data } = existingId
      ? await apiClient.patch<ApiMark>(endpoints.mark(courseId, existingId), toBody(input))
      : await apiClient.post<ApiMark>(endpoints.marks(courseId), toBody(input));
    return mapApiMark(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not save mark."));
  }
});

const marksSlice = createSlice({
  name: "marks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMarks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchMarks.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load marks.";
      })
      .addCase(saveMark.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(saveMark.fulfilled, (state, action: PayloadAction<Mark>) => {
        state.saveStatus = "succeeded";
        const index = state.items.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(saveMark.rejected, (state) => {
        state.saveStatus = "failed";
      });
  },
});

export default marksSlice.reducer;

export const selectMarks = (state: RootState) => state.marks.items;
export const selectMarksStatus = (state: RootState) => state.marks.status;
export const selectMarkFor = (assessmentId: string, officerId: string) => (state: RootState) =>
  state.marks.items.find((m) => m.assessmentId === assessmentId && m.officerId === officerId) ?? null;
