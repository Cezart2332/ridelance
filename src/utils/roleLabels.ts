/** User-facing labels for API role identifiers */
export const ROLE_LABELS: Record<string, string> = {
  Client: 'Șofer PFA',
  CarPoster: 'Cont inchiriere mașini',
  Contabil: 'Contabil',
  Admin: 'Admin',
}

export function formatRole(role: string | null | undefined): string {
  if (!role) return '—'
  return ROLE_LABELS[role] ?? role
}
