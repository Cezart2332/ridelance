import { useEffect } from 'react'
import {
  RECURRING_DOCUMENTATION_PUSH_TITLE,
  getRecurringDocumentationDeepLink,
  getRecurringDocumentationPushBody,
  getRomaniaMonthKey,
  isFirstDayOfMonthInRomania,
} from '../constants/recurringDocumentationNotification'
import { showLocalPushNotification } from '../lib/localNotification'
import { notificationService } from '../services/notification.service'

const SYNC_PREFIX = 'ridelance-recurring-doc-synced:'
const LOCAL_FALLBACK_PREFIX = 'ridelance-recurring-doc-local:'

async function dispatchRecurringDocumentationReminder(): Promise<void> {
  if (!isFirstDayOfMonthInRomania()) return

  const monthKey = getRomaniaMonthKey()
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
 * Ensures clients receive recurring-documentation reminders on the 1st of each month
 * (Europe/Bucharest) when the app is open. Backend cron should notify offline users.
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
