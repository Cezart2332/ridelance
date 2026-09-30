import type { ExportFormat } from '../../api/types'

/** Extensia după conținut: exportul „Excel” al mock-ului e CSV. */
export function exportName(base: string, blob: Blob, format: ExportFormat): string {
  return `${base}.${blob.type.startsWith('text/csv') ? 'csv' : format}`
}
