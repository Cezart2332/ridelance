import { useState } from 'react'
import { Box, Stack } from '@mui/material'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { HOME_TOKENS, reducedMotionSafe } from '../../tokens'
import { formatAxisNumber, formatCurrency, formatDate } from '../../format'
import type { RealProfitPoint } from '../../../../../services/pfaDashboard.service'
import { HomeCard } from '../HomeCard'
import { ChartDataTable, ChartTooltip } from './chartSetup'
import { axisProps, CHART, gridProps } from './chartTheme'

type SeriesKey = 'netEarnings' | 'value' | 'deductibleExpenses' | 'estimatedTaxes'

interface SeriesDef {
  key: SeriesKey
  label: string
  color: string
}

/**
 * Cele patru serii cerute de spec §7.1. Toate vin gata calculate din DTO — inclusiv
 * cheltuielile și taxele, repartizate pe bucket-uri de server. Graficul nu împarte nimic.
 */
const SERIES: SeriesDef[] = [
  { key: 'netEarnings', label: 'Încasări nete', color: CHART[1] },
  { key: 'value', label: 'Profit real estimat', color: CHART[2] },
  { key: 'deductibleExpenses', label: 'Cheltuieli', color: CHART[7] },
  { key: 'estimatedTaxes', label: 'Taxe estimate', color: CHART[6] },
]

interface FinancialTrendChartProps {
  points: RealProfitPoint[]
  granularity: 'day' | 'month'
  animate: boolean
}

/** Comutator de serie — apăsat înseamnă „se vede", nu „e selectat exclusiv". */
function SeriesToggle({
  series,
  active,
  onToggle,
}: {
  series: SeriesDef
  active: boolean
  onToggle: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      sx={reducedMotionSafe({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.7,
        px: 1.2,
        py: 0.5,
        cursor: 'pointer',
        borderRadius: HOME_TOKENS.radius.pill,
        border: `1px solid ${active ? series.color : HOME_TOKENS.border.subtle}`,
        bgcolor: active ? `${series.color}1A` : 'transparent',
        color: active ? HOME_TOKENS.text.primary : HOME_TOKENS.text.tertiary,
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        fontFamily: 'inherit',
        transition: 'background-color 140ms ease-out, border-color 140ms ease-out',
        '&:focus-visible': { outline: `2px solid ${series.color}`, outlineOffset: 2 },
      })}
    >
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: active ? series.color : HOME_TOKENS.border.strong,
        }}
      />
      {series.label}
    </Box>
  )
}

/**
 * „Evoluție financiară" — aceleași bucket-uri ca pe Acasă, dar cu toate cele patru mărimi
 * pe aceeași axă, ca să se vadă cât din încasări pleacă și cât rămâne.
 */
export function FinancialTrendChart({ points, granularity, animate }: FinancialTrendChartProps) {
  const [hidden, setHidden] = useState<SeriesKey[]>([])

  const toggle = (key: SeriesKey) =>
    setHidden((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key],
    )

  // Cel puțin o serie rămâne vizibilă: un grafic gol nu e o stare utilă.
  const visible = SERIES.filter((series) => !hidden.includes(series.key))
  const shown = visible.length > 0 ? visible : SERIES
  const hasNegative = points.some((point) => point.value < 0)

  return (
    <HomeCard title="Evoluție financiară" fill>
      <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', rowGap: 0.8, mb: 1.6 }}>
        {SERIES.map((series) => (
          <SeriesToggle
            key={series.key}
            series={series}
            active={shown.some((item) => item.key === series.key)}
            onToggle={() => toggle(series.key)}
          />
        ))}
      </Stack>

      <Box
        role="img"
        aria-label="Evoluția încasărilor, profitului, cheltuielilor și taxelor pe perioada selectată"
        sx={{ position: 'relative', height: 260, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={granularity === 'day' ? 16 : 4} />
            <YAxis {...axisProps} width={58} tickCount={5} tickFormatter={formatAxisNumber} />
            <Tooltip
              cursor={{ stroke: HOME_TOKENS.border.strong, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as RealProfitPoint | undefined
                if (!point) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={granularity === 'day' ? formatDate(point.bucket) : point.label}
                    entries={shown.map((series) => ({
                      name: series.label,
                      value: point[series.key],
                      color: series.color,
                      dataKey: series.key,
                    }))}
                  />
                )
              }}
            />
            {hasNegative && <ReferenceLine y={0} stroke={HOME_TOKENS.border.strong} strokeDasharray="4 4" />}
            {shown.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={animate}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption="Evoluția financiară pe perioada selectată"
          columns={['Perioadă', ...SERIES.map((series) => series.label)]}
          rows={points.map((point) => [
            point.label,
            ...SERIES.map((series) => formatCurrency(point[series.key])),
          ])}
        />
      </Box>
    </HomeCard>
  )
}
