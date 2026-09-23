/** Mărimea unui fișier, pe scurt: „850 KB”, „3,2 MB”. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} MB`
}
