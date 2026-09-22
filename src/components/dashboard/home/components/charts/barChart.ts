import { useState } from 'react'
import { alpha } from '@mui/material/styles'

import { formatDate } from '../../format'
import type { ChartGranularity } from '../../../../../services/pfaDashboard.service'

/** Titlul tooltipului: data zilei, intervalul săptămânii sau „Sep 2026”. */
export function bucketTitle(granularity: ChartGranularity, bucket: string, label: string): string {
  if (granularity === 'day') return `${label}, ${formatDate(bucket)}`
  if (granularity === 'month') return `${label} ${bucket.slice(0, 4)}`
  return label
}

/** Colțurile barelor: rotunjite complet sus, ca în graficele de tip „pill”. */
export const BAR_RADIUS: [number, number, number, number] = [8, 8, 8, 8]

/**
 * Bara activă (sub cursor sau atinsă pe telefon) e plină; celelalte se estompează, ca în
 * graficele de tip dashboard: ochiul merge direct la perioada citită în tooltip.
 */
export function useActiveBar() {
  const [active, setActive] = useState<number | null>(null)
  return {
    active,
    chartProps: {
      onMouseMove: (state: { activeTooltipIndex?: number | string | null }) => {
        const index = Number(state?.activeTooltipIndex)
        setActive(Number.isInteger(index) && state?.activeTooltipIndex != null ? index : null)
      },
      onMouseLeave: () => setActive(null),
    },
  }
}

export function barFill(color: string, index: number, active: number | null): string {
  if (active === null) return alpha(color, 0.78)
  return index === active ? color : alpha(color, 0.45)
}

/**
 * Axa X a graficelor cu bare: toate etichetele (cel mult 12 luni, 10 săptămâni sau 7 zile).
 * La săptămâni rămâne doar intervalul de zile („1–6”); luna e în tooltip.
 */
export function barXAxisProps(granularity: ChartGranularity) {
  return {
    interval: 0 as const,
    tickFormatter: granularity === 'week' ? (label: string) => label.replace(/ [^\s–]+/g, '') : undefined,
  }
}
