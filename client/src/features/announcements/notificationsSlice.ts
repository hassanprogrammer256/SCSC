import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppNotification, DeliveryStatus } from "@/types";
import type { RootState } from "@/app/store";
import { apiClient, fetchAllPages } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type ApiNotification = {
  id: string;
  announcement: string;
  title: string;
  body: string;
  sender_name: string;
  is_read: boolean;
  sms_status: DeliveryStatus;
  email_status: DeliveryStatus;
  created_at: string;
};

function mapApiNotification(api: ApiNotification): AppNotification {
  return {
    id: api.id,
    announcementId: api.announcement,
    title: api.title,
    body: api.body,
    senderName: api.sender_name,
    isRead: api.is_read,
    smsStatus: api.sms_status,
    emailStatus: api.email_status,
    createdAt: api.created_at,
  };
}

type NotificationsState = {
  items: AppNotification[];
  status: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: NotificationsState = { items: [], status: "idle" };

export const fetchNotifications = createAsyncThunk("notifications/fetchAll", async () => {
  const results = await fetchAllPages<ApiNotification>(endpoints.notifications);
  return results.map(mapApiNotification);
});

export const markNotificationRead = createAsyncThunk("notifications/markRead", async (notificationId: string) => {
  const { data } = await apiClient.patch<ApiNotification>(endpoints.notification(notificationId), { is_read: true });
  return mapApiNotification(data);
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<AppNotification[]>) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(markNotificationRead.fulfilled, (state, action: PayloadAction<AppNotification>) => {
        const index = state.items.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default notificationsSlice.reducer;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectUnreadCount = (state: RootState) => state.notifications.items.filter((n) => !n.isRead).length;
