import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

import {
  pfaDashboardService,
  type DashboardQuery,
  type PfaDashboardSummary,
  type RidesPage,
  type RidesQuery,
} from '../../../services/pfaDashboard.service'

export interface AsyncResource<T> {
  data: T | null
  /** Prima încărcare, când încă nu există nimic de afișat → skeleton. */
  isLoading: boolean
  /** Reîncărcare cu date vechi pe ecran → cross-fade, fără flash de skeleton. */
  isFetching: boolean
  error: string | null
  reload: () => void
}

/**
 * Ce s-a încărcat și pentru ce cheie. Ținând cheia lângă date, „se încarcă" se deduce
 * (`cheia încărcată ≠ cheia curentă`) în loc să fie pusă pe un `setState` din efect;
 * datele vechi rămân pe ecran până sosesc cele noi, ca la `keepPreviousData`.
 */
interface Loaded<T> {
  key: string
  data: T | null
  error: string | null
}

const EMPTY_LOADED = { key: '', data: null, error: null }

function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail
    if (detail) return detail
  }
  return 'Nu am putut încărca datele.'
}

function toResource<T>(loaded: Loaded<T>, key: string, enabled: boolean): AsyncResource<T> {
  const isFetching = enabled && loaded.key !== key
  return {
    data: loaded.data,
    isLoading: loaded.data === null && isFetching,
    isFetching,
    error: loaded.error,
    reload: () => {},
  }
}

export function useDashboardSummary(
  query: DashboardQuery,
  enabled = true,
): AsyncResource<PfaDashboardSummary> {
  const { from, to, platform, payment } = query
  const [reloadToken, setReloadToken] = useState(0)
  const [loaded, setLoaded] = useState<Loaded<PfaDashboardSummary>>(EMPTY_LOADED)
  const key = `${from}|${to}|${platform}|${payment}|${reloadToken}`

  useEffect(() => {
    if (!enabled) return undefined

    const controller = new AbortController()

    pfaDashboardService
      .getSummary({ from, to, platform, payment }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setLoaded({ key, data, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || axios.isCancel(cause)) return
        setLoaded((previous) => ({ key, data: previous.data, error: describeError(cause) }))
      })

    return () => controller.abort()
  }, [key, enabled, from, to, platform, payment])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  return { ...toResource(loaded, key, enabled), reload }
}

export function useRidesHistory(query: RidesQuery, enabled = true): AsyncResource<RidesPage> {
  const { from, to, platform, payment, page, pageSize, sort, q } = query
  const [reloadToken, setReloadToken] = useState(0)
  const [loaded, setLoaded] = useState<Loaded<RidesPage>>(EMPTY_LOADED)
  const key = `${from}|${to}|${platform}|${payment}|${page}|${pageSize}|${sort}|${q}|${reloadToken}`

  useEffect(() => {
    if (!enabled) return undefined

    const controller = new AbortController()

    pfaDashboardService
      .getRides({ from, to, platform, payment, page, pageSize, sort, q }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setLoaded({ key, data, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || axios.isCancel(cause)) return
        setLoaded((previous) => ({ key, data: previous.data, error: describeError(cause) }))
      })

    return () => controller.abort()
  }, [key, enabled, from, to, platform, payment, page, pageSize, sort, q])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  return { ...toResource(loaded, key, enabled), reload }
}
