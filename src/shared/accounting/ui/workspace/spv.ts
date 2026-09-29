import type { SpvMessageStatus, SpvRequestStatus } from '../../api/types'
import type { Cell } from './status'

/** Cererile SPV și câmpurile fiecăreia, ca pe server (`SpvRequestTypes`). */
export const SPV_REQUEST_TYPES: { type: string; label: string; fields: ('an' | 'luna' | 'numar_inregistrare')[] }[] = [
  { type: 'VECTOR FISCAL', label: 'Vector fiscal', fields: [] },
  { type: 'Obligatii de plata', label: 'Obligații de plată', fields: [] },
  { type: 'Nota obligatiilor de plata', label: 'Nota obligațiilor de plată', fields: [] },
  { type: 'Situatie Sintetica', label: 'Situație sintetică', fields: ['an', 'luna'] },
  { type: 'Fisa Rol', label: 'Fișa rol', fields: [] },
  { type: 'Istoric declaratii', label: 'Istoric declarații', fields: ['an'] },
  { type: 'Duplicat Recipisa', label: 'Duplicat recipisă', fields: ['numar_inregistrare'] },
  { type: 'D100', label: 'D100', fields: ['an', 'luna'] },
  { type: 'D301', label: 'D301', fields: ['an', 'luna'] },
  { type: 'D390', label: 'D390', fields: ['an', 'luna'] },
  { type: 'D212', label: 'D212', fields: ['an'] },
]

export const SPV_FIELD_LABEL: Record<'an' | 'luna' | 'numar_inregistrare', string> = {
  an: 'An',
  luna: 'Luna',
  numar_inregistrare: 'Număr înregistrare',
}

export const SPV_MESSAGE_CELL: Record<SpvMessageStatus, Cell> = {
  PROCESSED: { tone: 'green', label: 'Procesat' },
  NEW: { tone: 'blue', label: 'Nou' },
  NEEDS_ATTENTION: { tone: 'red', label: 'De verificat' },
}

export const SPV_REQUEST_CELL: Record<SpvRequestStatus, Cell> = {
  QUEUED: { tone: 'gray', label: 'În coadă' },
  SENDING: { tone: 'gray', label: 'Se trimite' },
  SENT: { tone: 'blue', label: 'Trimisă' },
  ANSWERED: { tone: 'green', label: 'Primit' },
  FAILED: { tone: 'red', label: 'Eșuată' },
}

export function spvTypeLabel(type: string): string {
  return SPV_REQUEST_TYPES.find((item) => item.type === type)?.label ?? type.charAt(0) + type.slice(1).toLowerCase()
}
