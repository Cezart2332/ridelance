import { RECURRING_DOCUMENTATION_ITEMS } from './recurringDocumentationItems'
import { PFA_PATHS } from '../config/pfaNavigation'
import {
  accountingMonthKey,
  formatAccountingDeadline,
  formatAccountingMonth,
  requestedAccountingMonth,
} from '../utils/accountingPeriod'

export const RECURRING_DOCUMENTATION_NOTIFICATION_TYPE = 'RecurringDocumentation' as const

/**
 * Textul cererii de documente, pe luna contabilă (vezi `utils/accountingPeriod`): ce lună și până
 * când. Aceleași cuvinte ca notificarea trimisă de server.
 */
export function getRecurringDocumentationNotificationText(date = new Date()): string {
  const target = requestedAccountingMonth(date)
  const checklist = RECURRING_DOCUMENTATION_ITEMS.map((i) => i.label).join(', ')
  return `Te rugăm să încarci documentele pentru ${formatAccountingMonth(target)}, până pe ${formatAccountingDeadline(target)}: ${checklist}.`
}

export const RECURRING_DOCUMENTATION_PUSH_TITLE = 'Documentație recurentă'

export function getRecurringDocumentationPushBody(date = new Date()): string {
  const target = requestedAccountingMonth(date)
  return `Încarcă documentele pentru ${formatAccountingMonth(target)} până pe ${formatAccountingDeadline(target)}.`
}

/** Deep link opened from push notification click */
export function getRecurringDocumentationDeepLink(): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}${PFA_PATHS.docsRecurring}`
}

/** Cheia lunii contabile cerute acum, `YYYY-MM`. O cerere pe lună, nu pe lună calendaristică. */
export function getRequestedAccountingMonthKey(date = new Date()): string {
  return accountingMonthKey(requestedAccountingMonth(date))
}

export function isRecurringDocumentationNotification(notification: { type: string }): boolean {
  return notification.type === RECURRING_DOCUMENTATION_NOTIFICATION_TYPE
}
