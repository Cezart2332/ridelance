import { useCallback, useEffect, useState } from 'react'

import { companyService, type CompanyProfile } from '../../../services/company.service'

/**
 * Profilul firmei, încărcat o dată și partajat de paginile care îl afișează.
 *
 * A înlocuit `useSrlMock(companyProfileMock)` din FAZA 1, păstrând aceeași formă de rezultat —
 * `data` / `loading` / `error` — exact ca să nu fie nevoie să se rescrie paginile odată cu sursa.
 */

export interface CompanyProfileState {
  data: CompanyProfile | null
  loading: boolean
  error: string | null
  /** Actualizează starea locală după o salvare reușită, fără să mai ceară o dată de la server. */
  setProfile: (profile: CompanyProfile) => void
  reload: () => void
}

export function useCompanyProfile(): CompanyProfileState {
  const [data, setData] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    companyService
      .getProfile()
      .then((profile) => {
        if (cancelled) return
        setData(profile)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setError('Nu am putut încărca profilul firmei.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const reload = useCallback(() => {
    setLoading(true)
    setReloadToken((token) => token + 1)
  }, [])

  return { data, loading, error, setProfile: setData, reload }
}
