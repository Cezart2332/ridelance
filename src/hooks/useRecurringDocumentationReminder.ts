import { useEffect } from 'react'
import { getRequestedAccountingMonthKey } from '../constants/recurringDocumentationNotification'
import { notificationService } from '../services/notification.service'

const SYNC_PREFIX = 'ridelance-recurring-doc-synced:'

/**
 * O dată pe lună contabilă, în orice zi a ferestrei ei (26 – 25): serverul trimite cererea doar
 * dacă n-a plecat deja, deci cine n-a deschis aplicația pe 26 o primește la prima deschidere.
 */
async function dispatchRecurringDocumentationReminder(): Promise<void> {
  const syncKey = `${SYNC_PREFIX}${getRequestedAccountingMonthKey()}`
  if (localStorage.getItem(syncKey)) return

  try {
    await notificationService.ensureMonthlyRecurringDocumentation()
    localStorage.setItem(syncKey, '1')
  } catch (error) {
    // Se reîncearcă la următoarea verificare: cheia lunii nu s-a scris.
    console.warn('Recurring documentation ensure failed.', error)
  }
}

/**
 * Cererea de documente lunare, cât timp aplicația e deschisă. Jobul serverului o trimite pe 26
 * (ora României); aici se acoperă cine n-a primit-o atunci.
 */
export function useRecurringDocumentationReminder(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const runCheck = () => {
      void dispatchRecurringDocumentationReminder()
    }

    runCheck()

    const onVisible = () => {
      if (document.visibilityState === 'visible') runCheck()
    }
    document.addEventListener('visibilitychange', onVisible)

    const dailyInterval = setInterval(runCheck, 60 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(dailyInterval)
    }
  }, [enabled])
}
