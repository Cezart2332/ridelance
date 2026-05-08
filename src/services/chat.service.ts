import { api } from '../lib/axios';

export interface ChatMessageDto {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  sentAtUtc: string;
  isRead: boolean;
}

export interface ChatMessageListResponse {
  messages: ChatMessageDto[];
  totalCount: number;
}

export interface SupportRoomResponse {
  roomId: string;
  supportUserId: string;
  supportUserName: string;
}

export const chatService = {
  getSupportRoom: async (): Promise<SupportRoomResponse> => {
    const response = await api.post<SupportRoomResponse>('/chat/support-room');
    return response.data;
  },

  getAccountantRoom: async (): Promise<SupportRoomResponse> => {
    const response = await api.post<SupportRoomResponse>('/chat/accountant-room');
    return response.data;
  },

  getOrCreateRoom: async (targetUserId: string): Promise<string> => {
    const response = await api.post<{ roomId: string }>('/chat/rooms', { targetUserId });
    return response.data.roomId;
  },

  getMessages: async (roomId: string, page = 1, pageSize = 50): Promise<ChatMessageListResponse> => {
    const response = await api.get<ChatMessageListResponse>(
      `/chat/rooms/${roomId}/messages?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },
};
