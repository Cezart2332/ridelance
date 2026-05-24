const RECURRING_DOC_ITEMS = [
  'Extrase bancare (toate conturile)',
  'Raport venituri Uber',
  'Raport venituri Bolt',
  'Facturi cheltuieli deductibile',
] as const

export const RECURRING_DOCUMENTATION_NOTIFICATION_TYPE = 'RecurringDocumentation' as const

const ROMANIA_TZ = 'Europe/Bucharest'

export function formatMonthLabelRomania(date = new Date()): string {
  return new Intl.DateTimeFormat('ro-RO', {
    timeZone: ROMANIA_TZ,
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getRecurringDocumentationNotificationText(date = new Date()): string {
  const month = formatMonthLabelRomania(date)
  const checklist = RECURRING_DOC_ITEMS.join(', ')
  return `Este începutul lunii (${month}). Te rugăm să încarci documentația recurentă: ${checklist}.`
}

export const RECURRING_DOCUMENTATION_PUSH_TITLE = 'Documentație recurentă'

export function getRecurringDocumentationPushBody(date = new Date()): string {
  return getRecurringDocumentationNotificationText(date)
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
