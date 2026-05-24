import { api } from '../lib/axios';
import {
  RECURRING_DOCUMENTATION_NOTIFICATION_TYPE,
  getRecurringDocumentationNotificationText,
} from '../constants/recurringDocumentationNotification';

export interface Notification {
  id: string;
  text: string;
  type: string;
  isRead: boolean;
  createdAtUtc: string;
}

export interface RecurringDocumentationEnsureResult {
  created: boolean;
  notificationId?: string;
  pushSent?: boolean;
}

export interface AdminTestRecurringDocumentationResult {
  usersNotified: number;
  pushSent: number;
  inAppCreated: number;
}

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  /**
   * Idempotent per user/month. Backend should create in-app notification + web push
   * when today is the 1st (Europe/Bucharest). Safe to call on app load.
   */
  ensureMonthlyRecurringDocumentation: async (): Promise<RecurringDocumentationEnsureResult> => {
    const response = await api.post<RecurringDocumentationEnsureResult>(
      '/notifications/recurring-documentation/ensure',
      {
        type: RECURRING_DOCUMENTATION_NOTIFICATION_TYPE,
        text: getRecurringDocumentationNotificationText(),
      },
    );
    return response.data;
  },

  /**
   * Admin: triggers the same pipeline as the monthly job (in-app + push for clients).
   */
  adminTestRecurringDocumentation: async (): Promise<AdminTestRecurringDocumentationResult> => {
    const response = await api.post<AdminTestRecurringDocumentationResult>(
      '/notifications/admin/test-recurring-documentation',
      {
        type: RECURRING_DOCUMENTATION_NOTIFICATION_TYPE,
        text: getRecurringDocumentationNotificationText(),
      },
    );
    return response.data;
  },
};
