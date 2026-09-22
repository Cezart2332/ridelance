
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { HOME_TOKENS } from '../../tokens'
import { formatAxisNumber, formatCurrency } from '../../format'
import type { RealProfitPoint, ChartGranularity } from '../../../../../services/pfaDashboard.service'
import { HomeCard } from '../HomeCard'
import { ChartDataTable, ChartLegend, ChartTooltip } from './chartSetup'
import { BAR_RADIUS, barFill, bucketTitle, useActiveBar, barXAxisProps } from './barChart'
import { axisProps, CHART, gridProps } from './chartTheme'
import { ChartFrame } from './ChartFrame'

interface RealProfitTrendChartProps {
  points: RealProfitPoint[]
  granularity: ChartGranularity
  animate: boolean
}

/**
 * „Evoluție profit real estimat". Pe fiecare perioadă, două bare alăturate: încasările nete
 * (treapta deschisă a accentului) și profitul real (accentul plin). Diferența dintre ele e
 * exact mesajul întregii pagini.
 */
export function RealProfitTrendChart({ points, granularity, animate }: RealProfitTrendChartProps) {
  const hasNegative = points.some((point) => point.value < 0)
  const activeBar = useActiveBar()

  return (
    <HomeCard title="Evoluție profit real estimat" fill>
      <ChartLegend
        items={[
          { label: 'Profit real estimat', color: CHART[1] },
          { label: 'Încasări nete', color: CHART[3] },
        ]}
      />

      <ChartFrame height={220} ariaLabel="Evoluția profitului real estimat față de încasările nete, pe perioada selectată">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={points}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="24%"
            barGap={3}
            {...activeBar.chartProps}
          >
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} {...barXAxisProps(granularity)} />
            <YAxis
              {...axisProps}
              width={58}
              tickCount={5}
              tickFormatter={formatAxisNumber}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as RealProfitPoint | undefined
                if (!point) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={bucketTitle(granularity, point.bucket, point.label)}
                    entries={[
                      {
                        name: 'Profit real estimat',
                        value: point.value,
                        color: CHART[1],
                        dataKey: 'value',
                      },
                      {
                        name: 'Încasări nete',
                        value: point.netEarnings,
                        color: CHART[3],
                        dataKey: 'netEarnings',
                      },
                    ]}
                  />
                )
              }}
            />
            <Bar dataKey="netEarnings" name="Încasări nete" radius={BAR_RADIUS} maxBarSize={22} isAnimationActive={animate}>
              {points.map((point, index) => (
                <Cell key={point.bucket} fill={barFill(CHART[3], index, activeBar.active)} />
              ))}
            </Bar>
            <Bar dataKey="value" name="Profit real estimat" radius={BAR_RADIUS} maxBarSize={22} isAnimationActive={animate}>
              {points.map((point, index) => (
                <Cell key={point.bucket} fill={barFill(point.value < 0 ? CHART[7] : CHART[1], index, activeBar.active)} />
              ))}
            </Bar>
            {hasNegative && <ReferenceLine y={0} stroke={HOME_TOKENS.border.strong} strokeDasharray="4 4" />}
          </BarChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption="Profit real estimat față de încasările nete"
          columns={['Perioadă', 'Încasări nete', 'Profit real estimat']}
          rows={points.map((point) => [
            point.label,
            formatCurrency(point.netEarnings),
            formatCurrency(point.value),
          ])}
        />
      </ChartFrame>
    </HomeCard>
  )
}
