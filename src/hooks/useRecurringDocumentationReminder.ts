import { useEffect } from 'react'
import { getRequestedAccountingMonthKey } from '../constants/recurringDocumentationNotification'
import { notificationService } from '../services/notification.service'
import { ACCOUNTING_CLOSE_DAY, romaniaDay } from '../utils/accountingPeriod'

// Prefix nou: cheile vechi, scrise oricând în lună, ar fi oprit anunțul din 1–5 ale lunii următoare.
const SYNC_PREFIX = 'ridelance-monthly-docs-ensured:'

/**
 * Anunțul „Închiderea lunii” pleacă pe 1; cine n-a deschis aplicația atunci îl primește la prima
 * deschidere până pe 5. Serverul trimite doar dacă n-a plecat deja.
 */
async function dispatchRecurringDocumentationReminder(): Promise<void> {
  if (romaniaDay(new Date()).day > ACCOUNTING_CLOSE_DAY) return
  const syncKey = `${SYNC_PREFIX}${getRequestedAccountingMonthKey()}`
  try {
    if (localStorage.getItem(syncKey)) return
  } catch {
    // Fără localStorage întrebăm serverul de fiecare dată; el deduplică.
  }

  try {
    await notificationService.ensureMonthlyRecurringDocumentation()
    try {
      localStorage.setItem(syncKey, '1')
    } catch {
      // Fără localStorage: următoarea verificare întreabă din nou serverul.
    }
  } catch (error) {
    // Se reîncearcă la următoarea verificare: cheia lunii nu s-a scris.
    console.warn('Recurring documentation ensure failed.', error)
  }
}

/**
 * Anunțul de închidere a lunii, cât timp aplicația e deschisă. Jobul serverului îl trimite pe 1
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
