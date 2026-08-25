import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ActivityAssignment, LandGroupName } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiActivityAssignment = {
  id: string;
  activity: string;
  land_group: string;
  land_group_name: LandGroupName;
  directing_staff: string;
};

function mapApiAssignment(apiAssignment: ApiActivityAssignment): ActivityAssignment {
  return {
    id: apiAssignment.id,
    activityId: apiAssignment.activity,
    landGroup: apiAssignment.land_group_name,
    directingStaffId: apiAssignment.directing_staff,
  };
}

type AssignmentsState = {
  courseId: string | null;
  items: ActivityAssignment[];
  status: "idle" | "loading" | "succeeded" | "failed";
  saveStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: AssignmentsState = {
  courseId: null,
  items: [],
  status: "idle",
  saveStatus: "idle",
  error: null,
};

export const fetchAssignments = createAsyncThunk("assignments/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiActivityAssignment>(endpoints.assignments(courseId));
  return { courseId, items: results.map(mapApiAssignment) };
});

// Creates a new assignment, or PATCHes the existing one in place when
// existingAssignmentId is supplied — the assignment board always has at most
// one assignment per (activity, land group) cell, matching the DB's
// unique_together("activity", "land_group") constraint, so reassigning a
// filled cell must never delete+recreate. See context/build-plan.md Phase 3
// /architect decision log.
export const upsertAssignment = createAsyncThunk<
  ActivityAssignment,
  { courseId: string; activityId: string; landGroupId: string; directingStaffId: string; existingAssignmentId?: string },
  { rejectValue: string }
>("assignments/upsert", async ({ courseId, activityId, landGroupId, directingStaffId, existingAssignmentId }, { rejectWithValue }) => {
  try {
    const body = { activity: activityId, land_group: landGroupId, directing_staff: directingStaffId };
    const { data } = existingAssignmentId
      ? await apiClient.patch<ApiActivityAssignment>(endpoints.assignment(courseId, existingAssignmentId), body)
      : await apiClient.post<ApiActivityAssignment>(endpoints.assignments(courseId), body);
    return mapApiAssignment(data);
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not save assignment."));
  }
});

export const removeAssignment = createAsyncThunk<
  string,
  { courseId: string; assignmentId: string },
  { rejectValue: string }
>("assignments/remove", async ({ courseId, assignmentId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(endpoints.assignment(courseId, assignmentId));
    return assignmentId;
  } catch (error) {
    return rejectWithValue(extractApiError(error, "Could not remove assignment."));
  }
});

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.courseId = action.payload.courseId;
        state.items = action.payload.items;
      })
      .addCase(fetchAssignments.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load assignments.";
      })
      .addCase(upsertAssignment.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(upsertAssignment.fulfilled, (state, action: PayloadAction<ActivityAssignment>) => {
        state.saveStatus = "succeeded";
        const index = state.items.findIndex((assignment) => assignment.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(upsertAssignment.rejected, (state) => {
        state.saveStatus = "failed";
      })
      .addCase(removeAssignment.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((assignment) => assignment.id !== action.payload);
      });
  },
});

export default assignmentsSlice.reducer;

export const selectAssignments = (state: RootState) => state.assignments.items;
export const selectAssignmentsStatus = (state: RootState) => state.assignments.status;
export const selectAssignmentFor = (activityId: string, landGroup: LandGroupName) => (state: RootState) =>
  state.assignments.items.find((a) => a.activityId === activityId && a.landGroup === landGroup) ?? null;
