import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Announcement, AnnouncementScope } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { extractApiError } from "@/lib/utils";

type ApiAnnouncement = {
  id: string;
  sender_name: string;
  title: string;
  body: string;
  scope: AnnouncementScope;
  course: string | null;
  land_group: string | null;
  activity: string | null;
  recipient_count: number;
  created_at: string;
};

function mapApiAnnouncement(api: ApiAnnouncement): Announcement {
  return {
    id: api.id,
    senderName: api.sender_name,
    title: api.title,
    body: api.body,
    scope: api.scope,
    courseId: api.course,
    landGroupId: api.land_group,
    activityId: api.activity,
    recipientCount: api.recipient_count,
    createdAt: api.created_at,
  };
}

export type AnnouncementInput = {
  title: string;
  body: string;
  scope: AnnouncementScope;
  courseId?: string;
  landGroupId?: string;
  activityId?: string;
  recipientIds?: string[];
};

type AnnouncementsState = {
  items: Announcement[];
  status: "idle" | "loading" | "succeeded" | "failed";
  sendStatus: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: AnnouncementsState = { items: [], status: "idle", sendStatus: "idle" };

export const fetchSentAnnouncements = createAsyncThunk("announcements/fetchSent", async () => {
  const results = await fetchAllPages<ApiAnnouncement>(endpoints.announcements);
  return results.map(mapApiAnnouncement);
});

export const sendAnnouncement = createAsyncThunk<Announcement, AnnouncementInput, { rejectValue: string }>(
  "announcements/send",
  async (input, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiAnnouncement>(endpoints.announcements, {
        title: input.title,
        body: input.body,
        scope: input.scope,
        course: input.courseId,
        land_group: input.landGroupId,
        activity: input.activityId,
        recipient_ids: input.recipientIds,
      });
      return mapApiAnnouncement(data);
    } catch (error) {
      return rejectWithValue(extractApiError(error, "Could not send announcement."));
    }
  },
);

const announcementsSlice = createSlice({
  name: "announcements",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSentAnnouncements.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSentAnnouncements.fulfilled, (state, action: PayloadAction<Announcement[]>) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchSentAnnouncements.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(sendAnnouncement.pending, (state) => {
        state.sendStatus = "loading";
      })
      .addCase(sendAnnouncement.fulfilled, (state, action: PayloadAction<Announcement>) => {
        state.sendStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(sendAnnouncement.rejected, (state) => {
        state.sendStatus = "failed";
      });
  },
});

export default announcementsSlice.reducer;

export const selectSentAnnouncements = (state: RootState) => state.announcements.items;
export const selectSentAnnouncementsStatus = (state: RootState) => state.announcements.status;
export const selectSendAnnouncementStatus = (state: RootState) => state.announcements.sendStatus;
