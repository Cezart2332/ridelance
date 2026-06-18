import { RECURRING_DOCUMENTATION_ITEMS } from './recurringDocumentationItems'

export const RECURRING_DOCUMENTATION_NOTIFICATION_TYPE = 'RecurringDocumentation' as const

const ROMANIA_TZ = 'Europe/Bucharest'

export function formatMonthLabelRomania(date = new Date()): string {
  return new Intl.DateTimeFormat('ro-RO', {
    timeZone: ROMANIA_TZ,
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getPreviousRomaniaMonthDate(date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ROMANIA_TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? date.getFullYear())
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? date.getMonth() + 1)
  return new Date(Date.UTC(year, month - 2, 1, 12))
}

export function formatPreviousMonthLabelRomania(date = new Date()): string {
  return formatMonthLabelRomania(getPreviousRomaniaMonthDate(date))
}

export function getRecurringDocumentationNotificationText(date = new Date()): string {
  const month = formatPreviousMonthLabelRomania(date)
  const checklist = RECURRING_DOCUMENTATION_ITEMS.map((i) => i.label).join(', ')
  return `Este începutul lunii. Te rugăm să încarci documentația recurentă pentru ${month}: ${checklist}.`
}

export const RECURRING_DOCUMENTATION_PUSH_TITLE = 'Documentație recurentă'

export function getRecurringDocumentationPushBody(date = new Date()): string {
  const month = formatPreviousMonthLabelRomania(date)
  return `Te rugăm să încarci documentele pentru ${month}.`
}

/** Deep link opened from push notification click */
export function getRecurringDocumentationDeepLink(): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/app/dashboard?section=doc_recurring`
}

export function isFirstDayOfMonthInRomania(date = new Date()): boolean {
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: ROMANIA_TZ,
    day: 'numeric',
  }).format(date)
  return day === '1'
}

/** YYYY-MM in Romania timezone */
export function getRomaniaMonthKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ROMANIA_TZ,
    year: 'numeric',
    month: '2-digit',
  }).format(date)
}

export function isRecurringDocumentationNotification(notification: { type: string }): boolean {
  return notification.type === RECURRING_DOCUMENTATION_NOTIFICATION_TYPE
}
