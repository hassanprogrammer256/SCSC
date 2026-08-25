import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LandGroupName, TimetableEntry } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiTimetableEntry = {
  id: string;
  activity: string;
  activity_name: string;
  land_group: string;
  land_group_name: LandGroupName;
  room: string;
  start_at: string;
  end_at: string;
};

function mapApiEntry(apiEntry: ApiTimetableEntry): TimetableEntry {
  return {
    id: apiEntry.id,
    activityId: apiEntry.activity,
    activityName: apiEntry.activity_name,
    landGroup: apiEntry.land_group_name,
    room: apiEntry.room,
    startAt: apiEntry.start_at,
    endAt: apiEntry.end_at,
  };
}

type EntryInput = { activityId: string; landGroupId: string; room: string; startAt: string; endAt: string };

type TimetableState = {
  courseId: string | null;
  items: TimetableEntry[];
  status: "idle" | "loading" | "succeeded" | "failed";
  saveStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: TimetableState = {
  courseId: null,
  items: [],
  status: "idle",
  saveStatus: "idle",
  error: null,
};

export const fetchTimetable = createAsyncThunk("timetable/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiTimetableEntry>(endpoints.timetable(courseId));
  return { courseId, items: results.map(mapApiEntry) };
});

function toBody(input: EntryInput) {
  return {
    activity: input.activityId,
    land_group: input.landGroupId,
    room: input.room,
    start_at: input.startAt,
    end_at: input.endAt,
  };
}

export const createTimetableEntry = createAsyncThunk<
  TimetableEntry,
  { courseId: string; input: EntryInput },
  { rejectValue: string }
>("timetable/create", async ({ courseId, input }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<ApiTimetableEntry>(endpoints.timetable(courseId), toBody(input));
    return mapApiEntry(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not save timetable entry."));
  }
});

export const updateTimetableEntry = createAsyncThunk<
  TimetableEntry,
  { courseId: string; entryId: string; input: EntryInput },
  { rejectValue: string }
>("timetable/update", async ({ courseId, entryId, input }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.patch<ApiTimetableEntry>(endpoints.timetableEntry(courseId, entryId), toBody(input));
    return mapApiEntry(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not save timetable entry."));
  }
});

export const deleteTimetableEntry = createAsyncThunk<
  string,
  { courseId: string; entryId: string },
  { rejectValue: string }
>("timetable/delete", async ({ courseId, entryId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(endpoints.timetableEntry(courseId, entryId));
    return entryId;
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not delete timetable entry."));
  }
});

const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimetable.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTimetable.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchTimetable.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load timetable.";
      })
      .addCase(createTimetableEntry.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(createTimetableEntry.fulfilled, (state, action: PayloadAction<TimetableEntry>) => {
        state.saveStatus = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(createTimetableEntry.rejected, (state) => {
        state.saveStatus = "failed";
      })
      .addCase(updateTimetableEntry.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(updateTimetableEntry.fulfilled, (state, action: PayloadAction<TimetableEntry>) => {
        state.saveStatus = "succeeded";
        const index = state.items.findIndex((entry) => entry.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateTimetableEntry.rejected, (state) => {
        state.saveStatus = "failed";
      })
      .addCase(deleteTimetableEntry.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((entry) => entry.id !== action.payload);
      });
  },
});

export default timetableSlice.reducer;

export const selectTimetableEntries = (state: RootState) => state.timetable.items;
export const selectTimetableStatus = (state: RootState) => state.timetable.status;
