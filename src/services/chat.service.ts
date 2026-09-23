import { api } from '../lib/axios';
import { prepareChatPhoto } from '../utils/imagesToPdf';

/** Fișierul atașat unui mesaj; conținutul se descarcă separat, cu autentificare. */
export interface ChatAttachmentDto {
  fileName: string;
  contentType: string;
  size: number;
}

export interface ChatMessageDto {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  sentAtUtc: string;
  isRead: boolean;
  attachment?: ChatAttachmentDto | null;
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

/** Aceeași limită ca pe server. */
export const CHAT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

/**
 * Ce acceptă chatul: poze, PDF, Word, Excel, CSV, text. `image/*` (nu HEIC explicit) face ca
 * iPhone-ul să trimită pozele din galerie deja convertite în JPEG, deci se văd în conversație.
 */
export const CHAT_ATTACHMENT_ACCEPT = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt';

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

  /**
   * Trimite un fișier, cu un mesaj opțional. Mesajul ajunge în cameră prin SignalR, ca oricare
   * altul — inclusiv la cel care l-a trimis.
   */
  sendAttachment: async (
    roomId: string,
    file: File,
    caption?: string,
    onProgress?: (percent: number) => void,
  ): Promise<ChatMessageDto> => {
    const upload = await prepareChatPhoto(file);
    const formData = new FormData();
    formData.append('file', upload);
    if (caption?.trim()) {
      formData.append('caption', caption.trim());
    }

    const response = await api.post<ChatMessageDto>(`/chat/rooms/${roomId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (event) => {
            if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
    });
    return response.data;
  },

  downloadAttachment: async (messageId: string): Promise<Blob> => {
    const response = await api.get(`/chat/messages/${messageId}/attachment`, { responseType: 'blob' });
    return response.data;
  },
};
