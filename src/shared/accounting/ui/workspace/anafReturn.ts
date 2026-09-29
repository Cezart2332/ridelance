import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useNotify } from '../notify'

/**
 * Întoarcerea de la autorizarea ANAF: serverul adaugă `anaf=conectat` sau `anaf_eroare=…` la
 * pagina de unde a plecat adminul. Mesajul apare o dată, iar parametrii dispar din URL.
 */
export function useAnafReturnNotice(): void {
  const notify = useNotify()
  const [params, setParams] = useSearchParams()
  const connected = params.get('anaf')
  const refused = params.get('anaf_eroare')

  useEffect(() => {
    if (!connected && !refused) return
    if (connected) notify('Contul ANAF e conectat.', 'success')
    if (refused) notify(refused, 'error')
    const next = new URLSearchParams(params)
    next.delete('anaf')
    next.delete('anaf_eroare')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, refused])
}

/** Pornește autorizarea ANAF și revine în pagina curentă. */
export async function startAnafAuthorization(start: (returnPath: string) => Promise<string>): Promise<void> {
  window.location.assign(await start(`${window.location.pathname}${window.location.search}`))
}
