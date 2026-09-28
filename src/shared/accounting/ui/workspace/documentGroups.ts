import type { PfaAccountingSummary, Platform, PlatformDocumentListItem, PlatformDocumentStatus, PlatformDocumentType } from '../../api/types'
import { PLATFORM_LABEL } from '../../statusLabels'
import type { Cell } from './status'

/** Ordinea în care un status cere atenție: un rând cu mai multe documente îl arată pe cel mai urgent. */
export const ATTENTION: PlatformDocumentStatus[] = ['EXTRACTION_FAILED', 'NEEDS_REVIEW', 'EXTRACTING', 'UPLOADED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'LOCKED']

export const STATUS_CELL: Record<PlatformDocumentStatus, Cell> = {
  UPLOADED: { tone: 'gray', label: 'Se citește' },
  EXTRACTING: { tone: 'gray', label: 'Se citește' },
  EXTRACTION_FAILED: { tone: 'red', label: 'Citire eșuată' },
  NEEDS_REVIEW: { tone: 'yellow', label: 'De verificat' },
  PENDING_CONFIRMATION: { tone: 'blue', label: 'De confirmat' },
  CONFIRMED: { tone: 'green', label: 'Confirmat' },
  LOCKED: { tone: 'green', label: 'Confirmat' },
}

const SLOTS: { type: Exclude<PlatformDocumentType, 'UNKNOWN'>; label: (platform: string, count: number) => string }[] = [
  { type: 'COMMISSION_INVOICE', label: (platform, count) => (count > 1 ? `Facturi ${platform} · ${count}` : `Factura ${platform}`) },
  { type: 'PLATFORM_REPORT', label: (platform) => `Raport lunar ${platform}` },
]

export interface DocumentGroup {
  key: string
  label: string
  documents: PlatformDocumentListItem[]
}

/** Rândurile așteptate pe platformă (facturi, raport), plus documentele încă neclasificate. */
export function documentGroups(summary: PfaAccountingSummary, documents: PlatformDocumentListItem[]): DocumentGroup[] {
  const sorted = [...documents].sort((a, b) => ATTENTION.indexOf(a.status) - ATTENTION.indexOf(b.status))
  const groups: DocumentGroup[] = summary.platforms.flatMap((platform: Platform) =>
    SLOTS.map((slot) => {
      const items = sorted.filter((document) => document.platform === platform && document.documentType === slot.type)
      return { key: `${platform}-${slot.type}`, label: slot.label(PLATFORM_LABEL[platform], items.length), documents: items }
    }),
  )
  const known = new Set(groups.flatMap((group) => group.documents.map((document) => document.id)))
  const other = sorted.filter((document) => !known.has(document.id))
  if (other.length > 0) groups.push({ key: 'other', label: other.length > 1 ? `Alte documente · ${other.length}` : other[0].fileName, documents: other })
  return groups
}


/** Inputul de fișiere al lunii: butoanele „Încarcă PDF” sunt etichete pentru el. */
export const uploadInputId = (pfaId: string) => `upload-platform-documents-${pfaId}`
