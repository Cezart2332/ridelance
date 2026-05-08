import { api } from '../lib/axios';

export interface Notification {
  id: string;
  text: string;
  type: string;
  isRead: boolean;
  createdAtUtc: string;
}

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
};
