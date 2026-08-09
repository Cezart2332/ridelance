import { Box } from '@mui/material'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { HOME_TOKENS } from '../../tokens'
import { formatAxisNumber, formatCurrency, formatDate } from '../../format'
import type { FeesAndTaxesPoint } from '../../../../../services/pfaDashboard.service'
import { HomeCard } from '../HomeCard'
import { ChartDataTable, ChartLegend, ChartTooltip } from './chartSetup'
import { axisProps, CHART, gridProps } from './chartTheme'

/**
 * Comisioanele în rampa accentului, taxele în ambru. Așa graficul spune vizual singurul
 * lucru care contează aici: **albastru = ce rețin platformele, ambru = ce reține statul.**
 * Culorile de brand ale platformelor n-au ce căuta pe stiva asta — ar sugera că verdele și
 * negrul sunt categorii de acelaşi rang cu TVA-ul.
 */
const SERIES = [
  { key: 'boltFee', label: 'Comision Bolt', color: CHART[1] },
  { key: 'uberFee', label: 'Comision Uber', color: CHART[2] },
  { key: 'vatIntracom', label: 'TVA intracomunitar', color: CHART[6] },
  { key: 'boltNonResident', label: 'Taxă nerezident', color: HOME_TOKENS.warn[400] },
] as const

interface FeesAndTaxesChartProps {
  points: FeesAndTaxesPoint[]
  granularity: 'day' | 'month'
  animate: boolean
}

/** „Comisioane și taxe estimate" — ce nu ajunge niciodată la tine, pe aceeași axă de timp. */
export function FeesAndTaxesChart({ points, granularity, animate }: FeesAndTaxesChartProps) {
  const total = points.reduce(
    (sum, point) => sum + point.boltFee + point.uberFee + point.vatIntracom + point.boltNonResident,
    0,
  )

  return (
    <HomeCard
      title="Comisioane și taxe estimate"
      hint="Comisioanele sunt reținute de platforme; TVA-ul intracomunitar și taxa de nerezident se calculează din ele."
      fill
    >
      <ChartLegend items={SERIES.map((series) => ({ label: series.label, color: series.color }))} />

      <Box
        role="img"
        aria-label={`Comisioane și taxe estimate, total ${formatCurrency(total)} în perioada selectată`}
        sx={{ position: 'relative', height: 220, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={granularity === 'day' ? 16 : 4} />
            <YAxis
              {...axisProps}
              width={54}
              tickCount={5}
              tickFormatter={formatAxisNumber}
            />
            <Tooltip
              cursor={{ fill: HOME_TOKENS.bg.surface2 }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as FeesAndTaxesPoint | undefined
                if (!point) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={granularity === 'day' ? formatDate(point.bucket) : point.label}
                    entries={SERIES.map((series) => ({
                      name: series.label,
                      value: point[series.key],
                      color: series.color,
                      dataKey: series.key,
                    }))}
                  />
                )
              }}
            />
            {SERIES.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                stackId="feesAndTaxes"
                fill={series.color}
                isAnimationActive={animate}
                maxBarSize={30}
                radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption="Comisioane și taxe estimate pe perioada selectată"
          columns={['Perioadă', ...SERIES.map((series) => series.label)]}
          rows={points.map((point) => [point.label, ...SERIES.map((series) => point[series.key])])}
        />
      </Box>
    </HomeCard>
  )
}
