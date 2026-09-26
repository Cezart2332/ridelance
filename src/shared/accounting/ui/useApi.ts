import { useEffect, useState } from 'react'

import { isAccountingApiError } from '../api/errors'

/** Mesajul de afișat pentru o eroare din `accountingApi` (mesajele API-ului sunt deja în română). */
export function errorMessage(error: unknown, fallback = 'A apărut o eroare. Încearcă din nou.'): string {
  if (isAccountingApiError(error)) return error.message
  return error instanceof Error && error.message ? error.message : fallback
}

interface ApiState<T> {
  key: string
  data: T | null
  error: string | null
}

/**
 * Încărcarea unei resurse din `accountingApi`, reîncărcată când se schimbă `deps` sau la `reload()`.
 *
 * Datele vechi rămân pe ecran cât se reîncarcă (fără pâlpâit la fiecare acțiune); `loading` spune
 * doar dacă răspunsul afișat e al cererii curente. Starea se setează numai din callback-urile
 * promisiunii, niciodată sincron în efect.
 */
export function useApi<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<ApiState<T> | null>(null)
  const key = JSON.stringify([deps, version])

  useEffect(() => {
    let cancelled = false
    load().then(
      (data) => {
        if (!cancelled) setState({ key, data, error: null })
      },
      (error: unknown) => {
        if (!cancelled) setState((previous) => ({ key, data: previous?.data ?? null, error: errorMessage(error) }))
      },
    )
    return () => {
      cancelled = true
    }
    // `load` e o funcție nouă la fiecare randare; ce contează e cheia derivată din `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return {
    data: state?.data ?? null,
    error: state?.key === key ? state.error : null,
    loading: state?.key !== key,
    reload: () => setVersion((current) => current + 1),
  }
}

/** Așteptarea dintre două interogări ale unui job sau ale unui document în citire. */
export const POLL_INTERVAL_MS = 1000

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Descarcă un Blob cu numele dat. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Deschide un Blob (PDF) într-un tab nou. */
export function openBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
