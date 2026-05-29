import { api } from '../lib/axios';

export interface DocumentSummary {
  id: string;
  originalFileName: string;
  contentType: string;
  category: string;
  status: string;
  fileSize: number;
  uploadedAtUtc: string;
  expiresAtUtc?: string | null;
}

export const documentService = {
  upload: async (file: File, category: string, pfaRegistrationId?: string, userId?: string, expiresAt?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (pfaRegistrationId) {
      formData.append('pfaRegistrationId', pfaRegistrationId);
    }
    if (userId) {
      formData.append('userId', userId);
    }
    if (expiresAt) {
      formData.append('expiresAt', expiresAt);
    }

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /** Get documents for the current user, or for a specific userId (admin/contabil). */
  getByUser: async (userId?: string): Promise<DocumentSummary[]> => {
    const params = userId ? { userId } : {};
    const response = await api.get<DocumentSummary[]>('/documents', { params });
    return response.data;
  },

  /** Download a document blob. */
  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /** Download a document and trigger a browser Save dialog. */
  downloadAndSave: async (id: string, fileName: string): Promise<void> => {
    const blob = await documentService.download(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /** Update the status of a document (Admin/Contabil only) */
  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.put(`/documents/${id}/status`, { status });
  },
};
