import { useRef, useState } from 'react'

import { accountingApi } from '../../api/accountingApi'
import type { Job, JobRef } from '../../api/types'
import { useNotify } from '../notify'
import { errorMessage, POLL_INTERVAL_MS, wait } from '../useApi'

/**
 * Pornește un job și îl urmărește până se termină (`GET /jobs/{id}`), cu progresul vizibil.
 * `onDone` rulează la final, ca ecranul să-și reîncarce datele.
 */
export function useJobRunner(onDone: () => void) {
  const notify = useNotify()
  const [job, setJob] = useState<Job | null>(null)
  const [starting, setStarting] = useState(false)
  const active = useRef(0)

  const start = async (launch: () => Promise<JobRef>) => {
    const runId = ++active.current
    setStarting(true)
    try {
      const { jobId } = await launch()
      for (;;) {
        const current = await accountingApi.jobs.get(jobId)
        if (runId !== active.current) return
        setJob(current)
        setStarting(false)
        if (current.status === 'COMPLETED' || current.status === 'FAILED') break
        await wait(POLL_INTERVAL_MS / 2)
      }
      onDone()
    } catch (error) {
      notify(errorMessage(error), 'error')
    } finally {
      setStarting(false)
    }
  }

  const running = starting || (job !== null && (job.status === 'QUEUED' || job.status === 'RUNNING'))
  return { job, running, start, clear: () => setJob(null) }
}
