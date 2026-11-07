import {
  ACCOUNTING_CLOSE_DAY,
  accountingMonthKey,
  requestedAccountingMonth,
} from '../utils/accountingPeriod'

export const RECURRING_DOCUMENTATION_NOTIFICATION_TYPE = 'RecurringDocumentation' as const
export const RECURRING_DOCUMENTATION_REMINDER_TYPE = 'RecurringDocumentationReminder' as const

/**
 * Anunțul de închidere a lunii (vezi `utils/accountingPeriod`). Aceleași cuvinte ca notificarea
 * trimisă de server.
 */
export function getRecurringDocumentationNotificationText(date = new Date()): string {
  const target = requestedAccountingMonth(date)
  const month = new Intl.DateTimeFormat('ro-RO', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(target.year, target.month - 1, 15)),
  )
  return (
    `Luna ${month} s-a încheiat! RIDElance preia automat tranzacțiile bancare, rapoartele Uber/Bolt și facturile din SPV.

` +
    `Tot ce trebuie să faci: încarcă în aplicație, până pe ${ACCOUNTING_CLOSE_DAY} ale lunii, bonurile fiscale pentru cheltuielile deductibile, care trebuie să conțină CUI-ul PFA-ului tău.

` +
    'Dacă nu ai bonuri de încărcat, nu trebuie să faci nimic. De restul ne ocupăm noi!'
  )
}

/** Cheia lunii contabile cerute acum, `YYYY-MM`. O cerere pe lună, nu pe lună calendaristică. */
export function getRequestedAccountingMonthKey(date = new Date()): string {
  return accountingMonthKey(requestedAccountingMonth(date))
}

export function isRecurringDocumentationNotification(notification: { type: string }): boolean {
  return (
    notification.type === RECURRING_DOCUMENTATION_NOTIFICATION_TYPE ||
    notification.type === RECURRING_DOCUMENTATION_REMINDER_TYPE
  )
}
