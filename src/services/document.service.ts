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
  /** Prevalidarea AI: None | Queued | Processing | Passed | Failed | Error */
  aiStatus: string;
  aiSummary?: string | null;
  aiDetectedType?: string | null;
  aiExtractedExpiresAtUtc?: string | null;
  /**
   * Un câmp citit prin OCR n-a trecut validatorul determinist (ex. CAEN ≠ 4939) sau are
   * încredere prea mică. Documentul rămâne acceptat — doar că îl verifică un om.
   */
  aiRequiresManualReview: boolean;
  /** `UserUpload` | `Prefilled` | `Inherited` | `SystemGenerated`. */
  origin: 'UserUpload' | 'Prefilled' | 'Inherited' | 'SystemGenerated';
  /**
   * Se arată în onboarding. Calculat pe server (RL-07): frontendul filtrează exclusiv după el,
   * fără reguli proprii — altfel două ecrane ar ascunde lucruri diferite.
   */
  isUserFacing: boolean;
}

/** Documentul este încă în coada de prevalidare automată (AI). */
export const isAiPending = (doc: DocumentSummary) =>
  doc.aiStatus === 'Queued' || doc.aiStatus === 'Processing';

// --- Câmpuri extrase prin OCR (precompletare + confirmare) ---
export type ExtractedFieldReviewState =
  | 'Auto'
  | 'NeedsUserConfirmation'
  | 'NeedsManualReview'
  | 'Confirmed';

export interface ExtractedField {
  id: string;
  fieldKey: string;
  aiValue: string | null;
  confirmedValue: string | null;
  effectiveValue: string | null;
  effectiveConfidence: number;
  validatorPassed: boolean;
  isSensitive: boolean;
  reviewState: ExtractedFieldReviewState;
  confirmedSource: 'None' | 'User' | 'Admin';
}

export interface ExtractedFieldsResponse {
  documentId: string;
  category: string;
  overallConfidence: number | null;
  requiresManualReview: boolean;
  fields: ExtractedField[];
}

export const documentService = {
  /**
   * @param onProgress Progresul real al uploadului, 0–100. Distinct de prevalidarea automată,
   *   care începe abia după ce fișierul a ajuns pe server (vezi `isAiPending`).
   */
  upload: async (
    file: File,
    category: string,
    pfaRegistrationId?: string,
    userId?: string,
    expiresAt?: string,
    onProgress?: (percent: number) => void,
  ) => {
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
      onUploadProgress: onProgress
        ? (event) => {
            // `total` lipsește când serverul nu trimite Content-Length pe stream.
            if (!event.total) return;
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
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

  /** Open a document blob in a browser tab so PDFs/images can be viewed in-site. */
  openInNewTab: async (id: string, fileName: string): Promise<void> => {
    const previewWindow = window.open('', '_blank');
    const blob = await documentService.download(id);
    const url = URL.createObjectURL(blob);

    if (previewWindow) {
      previewWindow.document.title = fileName;
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  /** Update the status of a document (Admin/Contabil only) */
  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.put(`/documents/${id}/status`, { status });
  },

  /** Câmpurile extrase prin OCR pentru un document (ecran de confirmare). */
  getExtractedFields: async (id: string): Promise<ExtractedFieldsResponse> => {
    const response = await api.get<ExtractedFieldsResponse>(`/documents/${id}/extracted-fields`);
    return response.data;
  },

  /** Clientul confirmă/corectează valorile precompletate. */
  confirmExtractedFields: async (
    id: string,
    fields: { fieldKey: string; value: string | null }[],
  ): Promise<ExtractedFieldsResponse> => {
    const response = await api.post<ExtractedFieldsResponse>(`/documents/${id}/extracted-fields/confirm`, { fields });
    return response.data;
  },

  /** Admin — vede câmpurile extrase ale oricărui document. */
  getExtractedFieldsAdmin: async (id: string): Promise<ExtractedFieldsResponse> => {
    const response = await api.get<ExtractedFieldsResponse>(`/admin/documents/${id}/extracted-fields`);
    return response.data;
  },

  /** Admin — corectează o valoare extrasă (motiv obligatoriu). */
  correctExtractedField: async (fieldId: string, value: string | null, changeReason: string): Promise<void> => {
    await api.put(`/admin/extracted-fields/${fieldId}`, { value, changeReason });
  },
};
