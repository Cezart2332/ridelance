import { useEffect } from 'react'
import {
  RECURRING_DOCUMENTATION_PUSH_TITLE,
  getRecurringDocumentationDeepLink,
  getRecurringDocumentationPushBody,
  getRequestedAccountingMonthKey,
} from '../constants/recurringDocumentationNotification'
import { showLocalPushNotification } from '../lib/localNotification'
import { notificationService } from '../services/notification.service'

const SYNC_PREFIX = 'ridelance-recurring-doc-synced:'
const LOCAL_FALLBACK_PREFIX = 'ridelance-recurring-doc-local:'

/**
 * O dată pe lună contabilă, în orice zi a ferestrei ei (26 – 25): serverul trimite cererea doar
 * dacă n-a plecat deja, deci cine n-a deschis aplicația pe 26 o primește la prima deschidere.
 */
async function dispatchRecurringDocumentationReminder(): Promise<void> {
  const monthKey = getRequestedAccountingMonthKey()
  const syncKey = `${SYNC_PREFIX}${monthKey}`
  if (localStorage.getItem(syncKey)) return

  try {
    const result = await notificationService.ensureMonthlyRecurringDocumentation()
    localStorage.setItem(syncKey, '1')

    if (result.created && !result.pushSent) {
      await showLocalPushNotification(
        RECURRING_DOCUMENTATION_PUSH_TITLE,
        getRecurringDocumentationPushBody(),
        getRecurringDocumentationDeepLink(),
      )
    }
  } catch (error) {
    console.warn('Recurring documentation ensure failed; using local fallback if permitted.', error)
    const fallbackKey = `${LOCAL_FALLBACK_PREFIX}${monthKey}`
    if (localStorage.getItem(fallbackKey)) return

    await showLocalPushNotification(
      RECURRING_DOCUMENTATION_PUSH_TITLE,
      getRecurringDocumentationPushBody(),
      getRecurringDocumentationDeepLink(),
    )
    localStorage.setItem(fallbackKey, '1')
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
