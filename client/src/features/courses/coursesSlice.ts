import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Course, LandGroupName } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiLandGroup = { id: string; course: string; name: LandGroupName };

type ApiCourse = {
  id: string;
  code: string;
  start_year: number;
  status: Course["status"];
  officer_count: number;
  directing_staff_count: number;
  progress_percent: number;
  land_groups: ApiLandGroup[];
};

function mapApiCourse(apiCourse: ApiCourse): Course {
  return {
    id: apiCourse.id,
    code: apiCourse.code,
    startYear: apiCourse.start_year,
    status: apiCourse.status,
    officerCount: apiCourse.officer_count,
    directingStaffCount: apiCourse.directing_staff_count,
    progressPercent: apiCourse.progress_percent,
    landGroups: apiCourse.land_groups.map((group) => ({ id: group.id, courseId: group.course, name: group.name })),
  };
}

type CoursesState = {
  items: Course[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: CoursesState = { items: [], status: "idle", error: null };

export const fetchCourses = createAsyncThunk("courses/fetchAll", async () => {
  const results = await fetchAllPages<ApiCourse>(endpoints.courses);
  return results.map(mapApiCourse);
});

export const createCourse = createAsyncThunk<Course, { code: string }, { rejectValue: string }>(
  "courses/create",
  async (input, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiCourse>(endpoints.courses, { code: input.code });
      return mapApiCourse(data);
    } catch (error) {
      return rejectWithValue(extractApiError(error, "Could not create course."));
    }
  },
);

export const markCourseCompleted = createAsyncThunk<Course, string, { rejectValue: string }>(
  "courses/markCompleted",
  async (courseId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<ApiCourse>(endpoints.course(courseId), { status: "completed" });
      return mapApiCourse(data);
    } catch (error) {
      return rejectWithValue(extractApiError(error, "Could not mark course completed."));
    }
  },
);

export const archiveCourse = createAsyncThunk<Course, string, { rejectValue: string }>(
  "courses/archive",
  async (courseId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiCourse>(endpoints.archiveCourse(courseId));
      return mapApiCourse(data);
    } catch (error) {
      return rejectWithValue(extractApiError(error, "Could not archive course."));
    }
  },
);

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCourses.rejected, (state) => {
        state.status = "failed";
        state.error = "Could not load courses.";
      })
      .addCase(createCourse.fulfilled, (state, action: PayloadAction<Course>) => {
        state.items.unshift(action.payload);
      })
      .addCase(markCourseCompleted.fulfilled, (state, action: PayloadAction<Course>) => {
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(archiveCourse.fulfilled, (state, action: PayloadAction<Course>) => {
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default coursesSlice.reducer;

export const selectCourses = (state: RootState) => state.courses.items;
export const selectCoursesStatus = (state: RootState) => state.courses.status;
export const selectActiveCourse = (state: RootState) => state.courses.items.find((course) => course.status === "active") ?? null;
export const selectCourseById = (courseId: string | undefined) => (state: RootState) =>
  courseId ? (state.courses.items.find((course) => course.id === courseId) ?? null) : null;
export const selectArchivedCourses = (state: RootState) => state.courses.items.filter((course) => course.status === "archived");
