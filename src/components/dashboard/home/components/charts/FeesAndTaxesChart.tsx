import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { HOME_TOKENS } from '../../tokens'
import { formatAxisNumber, formatCurrency } from '../../format'
import type { FeesAndTaxesPoint, ChartGranularity } from '../../../../../services/pfaDashboard.service'
import { HomeCard } from '../HomeCard'
import { ChartDataTable, ChartLegend, ChartTooltip } from './chartSetup'
import { barFill, bucketTitle, useActiveBar, barXAxisProps } from './barChart'
import { axisProps, CHART, gridProps } from './chartTheme'
import { ChartFrame } from './ChartFrame'

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
  granularity: ChartGranularity
  animate: boolean
  /**
   * Profilul fiscal nu e confirmat: backendul nu trimite taxele, deci graficul arată doar
   * comisioanele platformelor, sub alt titlu. Nicio taxă afișată ca 0.
   */
  taxesLocked?: boolean
}

/** „Comisioane și taxe estimate" — ce nu ajunge niciodată la tine, pe aceeași axă de timp. */
export function FeesAndTaxesChart({ points, granularity, animate, taxesLocked = false }: FeesAndTaxesChartProps) {
  const shown = taxesLocked ? SERIES.filter((s) => s.key === 'boltFee' || s.key === 'uberFee') : SERIES
  const total = points.reduce((sum, point) => sum + shown.reduce((s, item) => s + (point[item.key] ?? 0), 0), 0)
  const title = taxesLocked ? 'Comisioane platforme' : 'Comisioane și taxe estimate'
  const activeBar = useActiveBar()


  return (
    <HomeCard
      title={title}
      hint={
        taxesLocked
          ? 'Comisioanele reținute de platforme. Taxele estimate apar după ce completezi profilul fiscal.'
          : 'Comisioanele sunt reținute de platforme; TVA-ul intracomunitar și taxa de nerezident se calculează din ele.'
      }
      fill
    >
      <ChartLegend items={shown.map((series) => ({ label: series.label, color: series.color }))} />

      <ChartFrame height={220} ariaLabel={`${title}, total ${formatCurrency(total)} în perioada selectată`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={points}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="28%"
            {...activeBar.chartProps}
          >
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} {...barXAxisProps(granularity)} />
            <YAxis
              {...axisProps}
              width={54}
              tickCount={5}
              tickFormatter={formatAxisNumber}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as FeesAndTaxesPoint | undefined
                if (!point) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={bucketTitle(granularity, point.bucket, point.label)}
                    entries={shown.map((series) => ({
                      name: series.label,
                      value: point[series.key] ?? 0,
                      color: series.color,
                      dataKey: series.key,
                    }))}
                  />
                )
              }}
            />
            {shown.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                stackId="feesAndTaxes"
                fill={series.color}
                isAnimationActive={animate}
                maxBarSize={36}
                radius={index === shown.length - 1 ? [8, 8, 0, 0] : undefined}
              >
                {points.map((point, pointIndex) => (
                  <Cell key={point.bucket} fill={barFill(series.color, pointIndex, activeBar.active)} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption="Comisioane și taxe estimate pe perioada selectată"
          columns={['Perioadă', ...shown.map((series) => series.label)]}
          rows={points.map((point) => [point.label, ...shown.map((series) => point[series.key] ?? 0)])}
        />
      </ChartFrame>
    </HomeCard>
  )
}
