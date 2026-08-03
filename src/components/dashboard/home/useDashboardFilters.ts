import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { DashboardPayment, DashboardPlatform } from '../../../services/pfaDashboard.service'

export type PeriodPreset = 'week' | 'month' | 'prevMonth' | 'year' | 'custom'

export interface DashboardFilters {
  period: PeriodPreset
  /** Interval efectiv, derivat din preset — formatul e ISO `AAAA-LL-ZZ`. */
  from: string
  to: string
  platform: DashboardPlatform
  payment: DashboardPayment
  /** Adevărat când nimic nu e schimbat față de default → butonul de reset dispare. */
  isDefault: boolean
}

const DEFAULT_PERIOD: PeriodPreset = 'month'

function toIso(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isIsoDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/**
 * Intervalul unui preset, calculat față de ziua curentă. Săptămâna începe luni,
 * ca în calendarul românesc.
 */
export function resolvePreset(preset: PeriodPreset, today = new Date()): { from: string; to: string } {
  const year = today.getFullYear()
  const month = today.getMonth()

  switch (preset) {
    case 'week': {
      const weekday = (today.getDay() + 6) % 7
      const monday = new Date(year, month, today.getDate() - weekday)
      const sunday = new Date(year, month, today.getDate() - weekday + 6)
      return { from: toIso(monday), to: toIso(sunday) }
    }
    case 'prevMonth':
      return { from: toIso(new Date(year, month - 1, 1)), to: toIso(new Date(year, month, 0)) }
    case 'year':
      return { from: toIso(new Date(year, 0, 1)), to: toIso(new Date(year, 11, 31)) }
    case 'month':
    default:
      return { from: toIso(new Date(year, month, 1)), to: toIso(new Date(year, month + 1, 0)) }
  }
}

/**
 * Sursa unică de adevăr pentru filtre. Starea trăiește în URL, deci e shareable,
 * rezistă la refresh și la butonul Back. Niciun card nu are filtru local.
 */
export function useDashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<DashboardFilters>(() => {
    const rawPeriod = searchParams.get('period')
    const period: PeriodPreset =
      rawPeriod === 'week' || rawPeriod === 'prevMonth' || rawPeriod === 'year' || rawPeriod === 'custom'
        ? rawPeriod
        : DEFAULT_PERIOD

    const rawPlatform = searchParams.get('platform')
    const platform: DashboardPlatform =
      rawPlatform === 'bolt' || rawPlatform === 'uber' ? rawPlatform : 'all'

    const rawPayment = searchParams.get('payment')
    const payment: DashboardPayment = rawPayment === 'card' || rawPayment === 'cash' ? rawPayment : 'all'

    const paramFrom = searchParams.get('from')
    const paramTo = searchParams.get('to')

    // Un „custom" fără interval valid în URL nu are ce afișa — cade pe luna curentă.
    const range =
      period === 'custom' && isIsoDate(paramFrom) && isIsoDate(paramTo)
        ? { from: paramFrom, to: paramTo }
        : resolvePreset(period === 'custom' ? DEFAULT_PERIOD : period)

    return {
      period,
      from: range.from,
      to: range.to,
      platform,
      payment,
      isDefault: period === DEFAULT_PERIOD && platform === 'all' && payment === 'all',
    }
  }, [searchParams])

  const patch = useCallback(
    (next: Record<string, string | null>) => {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous)
          Object.entries(next).forEach(([key, value]) => {
            if (value === null) {
              params.delete(key)
            } else {
              params.set(key, value)
            }
          })
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setPeriod = useCallback(
    (period: PeriodPreset) => {
      if (period === 'custom') {
        const range = resolvePreset(DEFAULT_PERIOD)
        patch({ period, from: range.from, to: range.to })
        return
      }
      patch({ period, from: null, to: null })
    },
    [patch],
  )

  const setCustomRange = useCallback(
    (from: string, to: string) => patch({ period: 'custom', from, to }),
    [patch],
  )

  const setPlatform = useCallback((platform: DashboardPlatform) => patch({ platform }), [patch])
  const setPayment = useCallback((payment: DashboardPayment) => patch({ payment }), [patch])

  const reset = useCallback(
    () => patch({ period: null, from: null, to: null, platform: null, payment: null }),
    [patch],
  )

  return { filters, setPeriod, setCustomRange, setPlatform, setPayment, reset }
}
