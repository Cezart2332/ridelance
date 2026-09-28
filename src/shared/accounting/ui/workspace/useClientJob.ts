import { useState } from 'react'

import { accountingApi } from '../../api/accountingApi'
import type { JobRef } from '../../api/types'
import { useNotify } from '../notify'
import { errorMessage, POLL_INTERVAL_MS, wait } from '../useApi'

/**
 * Un job al lunii pornit pentru un singur client (procesare, generare, validare): așteaptă să se
 * termine și spune rezultatul într-o notificare. `busy` ține cheia acțiunii în curs.
 */
export function useClientJob(onDone: () => void) {
  const notify = useNotify()
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (key: string, launch: () => Promise<JobRef>) => {
    setBusy(key)
    try {
      const { jobId } = await launch()
      for (;;) {
        const job = await accountingApi.jobs.get(jobId)
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          const error = job.errors[0]?.message
          const result = job.results[0]?.message
          if (error) notify(error, 'error')
          else if (result) notify(result, 'success')
          break
        }
        await wait(POLL_INTERVAL_MS / 2)
      }
      onDone()
    } catch (error) {
      notify(errorMessage(error), 'error')
    } finally {
      setBusy(null)
    }
  }

  return { busy, run }
}
