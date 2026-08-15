import { api } from '../lib/axios'

export type DocumentGroup = 'personal' | 'pfa' | 'vehicle'

/**
 * Starea vine gata calculată de server. Frontendul nu deduce nimic din date: „expiră în X zile"
 * e aritmetică de calendar în fusul României, iar browserul are alt ceas.
 */
export type DocumentOverviewStatus =
  | 'Lipsa'
  | 'Valid'
  | 'ExpiraCurand'
  | 'Expirat'
  | 'InVerificare'
  | 'Respins'

export interface DocumentOverviewItem {
  key: string
  label: string
  hasIssueDate: boolean
  hasExpiryDate: boolean
  isOptional: boolean
  status: DocumentOverviewStatus
  documentId: string | null
  originalFileName: string | null
  contentType: string | null
  uploadedAtUtc: string | null
  issuedOn: string | null
  expiresOn: string | null
  /** Negativ după expirare; null când tipul nu expiră sau nu există document. */
  daysUntilExpiry: number | null
}

export interface DocumentsOverview {
  group: string
  items: DocumentOverviewItem[]
}

export const documentsOverviewService = {
  getGroup: async (group: DocumentGroup, signal?: AbortSignal): Promise<DocumentsOverview> => {
    const response = await api.get<DocumentsOverview>('/documents/overview', { params: { group }, signal })
    return response.data
  },
}
