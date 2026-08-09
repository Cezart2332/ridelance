import type { DashboardSources } from '../../../services/pfaDashboard.service'

/** Peste atâtea zile, un raport Uber e prea vechi ca să fie de încredere. */
export const UBER_STALE_DAYS = 10

/** Bolt sincronizează automat; peste 24h ceva nu e în regulă. */
export const BOLT_STALE_HOURS = 24

export function isBoltStale(sources: DashboardSources): boolean {
  if (!sources.bolt.configured) return false
  if (!sources.bolt.connected || !sources.bolt.lastSyncAt) return true
  const hours = (Date.now() - new Date(sources.bolt.lastSyncAt).getTime()) / 36e5
  return hours > BOLT_STALE_HOURS
}

export function isUberStale(sources: DashboardSources): boolean {
  if (!sources.uber.connected || !sources.uber.lastReportAt) return false
  const days = (Date.now() - new Date(sources.uber.lastReportAt).getTime()) / 864e5
  return days > UBER_STALE_DAYS
}

// Vechimea unei surse se semnalează exclusiv prin punctul ambru din pastila din antet, cu data
// exactă în tooltip. Nu există banner și nici alertă escaladată: „datele pot fi în urmă" nu
// spunea utilizatorului nimic pe care să poată acționa, dar ocupa un rând întreg deasupra cifrelor.
