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

/**
 * Peste atâtea zile, „datele pot fi în urmă" nu mai e o notă de subsol: cifrele de pe ecran
 * descriu altă perioadă decât cea selectată. Abia atunci merită un `Alert` vizibil.
 */
export const SEVERE_STALE_DAYS = 7

const ageInDays = (iso: string | null): number | null => {
  if (!iso) return null
  const time = new Date(iso).getTime()
  return Number.isNaN(time) ? null : (Date.now() - time) / 864e5
}

/** Vechimea celei mai vechi surse active, în zile. */
export function oldestSourceAgeDays(sources: DashboardSources): number | null {
  const ages = [
    sources.bolt.configured ? ageInDays(sources.bolt.lastSyncAt) : null,
    sources.uber.connected ? ageInDays(sources.uber.lastReportAt) : null,
  ].filter((age): age is number => age !== null)

  return ages.length > 0 ? Math.max(...ages) : null
}

/**
 * Escaladarea din §2.4: o sursă e nu doar învechită după regula ei, ci veche în termeni
 * absoluți. Punctul ambru din pastilă acoperă restul cazurilor, fără să ocupe un rând întreg.
 */
export function isSeverelyStale(sources: DashboardSources): boolean {
  if (!isBoltStale(sources) && !isUberStale(sources)) return false
  const age = oldestSourceAgeDays(sources)
  return age !== null && age > SEVERE_STALE_DAYS
}
