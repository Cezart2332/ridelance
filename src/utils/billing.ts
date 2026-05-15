/**
 * Billing date utilities for RIDElance weekly Monday 3PM billing.
 *
 * Rules:
 *  - Subscriptions always bill on Monday at 15:00 Romania time (EEST/EET).
 *  - Regardless of when the user pays, the FIRST billing cycle starts next Monday 15:00.
 *  - The user's account shows "Activ — plată programată luni 15:00" until then.
 */

/** Returns Romania's current UTC offset in hours (EEST=+3 summer, EET=+2 winter). */
function getRomaniaOffsetHours(): number {
  // Rough DST rule: last Sunday in March → last Sunday in October
  const now = new Date()
  const year = now.getUTCFullYear()
  const lastSundayMarch = getLastSunday(year, 2) // month 2 = March (0-indexed)
  const lastSundayOctober = getLastSunday(year, 9) // month 9 = October
  return now >= lastSundayMarch && now < lastSundayOctober ? 3 : 2
}

function getLastSunday(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month + 1, 1)) // 1st of next month
  d.setUTCDate(d.getUTCDate() - 1) // last day of month
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()) // back to Sunday
  return d
}

/**
 * Returns the next Monday 15:00 Romania time as a UTC Date.
 * Always returns a date strictly in the future (at least the coming Monday).
 */
export function getNextMondayBillingDate(): Date {
  const now = new Date()
  const offsetHours = getRomaniaOffsetHours()

  // Current Romania time in UTC-equivalent values
  const nowRomania = new Date(now.getTime() + offsetHours * 60 * 60 * 1000)

  const dayOfWeek = nowRomania.getUTCDay() // 0=Sun,1=Mon,...,6=Sat
  const hourRo = nowRomania.getUTCHours()
  const minuteRo = nowRomania.getUTCMinutes()

  // Days until next Monday
  let daysUntilMonday: number
  if (dayOfWeek === 1) {
    // It's Monday — if before 15:00 we already missed this billing slot, use next week
    const beforeBilling = hourRo < 15 || (hourRo === 15 && minuteRo === 0)
    daysUntilMonday = beforeBilling ? 7 : 7 // always next week per business rules
  } else {
    daysUntilMonday = (8 - dayOfWeek) % 7 || 7
  }

  // Build the next-Monday date at 15:00 Romania
  const nextMondayRomania = new Date(nowRomania)
  nextMondayRomania.setUTCDate(nowRomania.getUTCDate() + daysUntilMonday)
  nextMondayRomania.setUTCHours(15, 0, 0, 0)

  // Convert back to UTC
  const nextMondayUTC = new Date(nextMondayRomania.getTime() - offsetHours * 60 * 60 * 1000)
  return nextMondayUTC
}

/** Format a Date for display in Romanian locale. */
export function formatRomanianDate(date: Date): string {
  return date.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Returns true if the billing date is in the future (account is "pending billing"). */
export function isPendingBilling(billingDate: Date): boolean {
  return billingDate > new Date()
}
