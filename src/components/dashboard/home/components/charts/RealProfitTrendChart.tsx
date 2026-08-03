import { Box } from '@mui/material'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { HOME_TOKENS } from '../../tokens'
import { formatAxisNumber, formatCurrency, formatDate } from '../../format'
import type { RealProfitPoint } from '../../../../../services/pfaDashboard.service'
import { HomeCard } from '../HomeCard'
import { ChartDataTable, ChartLegend, ChartTooltip } from './chartSetup'
import { axisProps, gridProps } from './chartTheme'

interface RealProfitTrendChartProps {
  points: RealProfitPoint[]
  granularity: 'day' | 'month'
  animate: boolean
}

/**
 * „Evoluție profit real estimat". Banda gri din spate sunt încasările nete: distanța
 * dintre ea și linie e exact mesajul întregii pagini.
 */
export function RealProfitTrendChart({ points, granularity, animate }: RealProfitTrendChartProps) {
  const hasNegative = points.some((point) => point.value < 0)

  return (
    <HomeCard title="Evoluție profit real estimat" fill>
      <ChartLegend
        items={[
          { label: 'Profit real estimat', color: HOME_TOKENS.brand[600] },
          { label: 'Încasări nete', color: HOME_TOKENS.border.strong },
        ]}
      />

      <Box
        role="img"
        aria-label="Evoluția profitului real estimat față de încasările nete, pe perioada selectată"
        sx={{ position: 'relative', height: 220, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={granularity === 'day' ? 16 : 4} />
            <YAxis
              {...axisProps}
              width={58}
              tickCount={5}
              tickFormatter={formatAxisNumber}
            />
            <Tooltip
              cursor={{ stroke: HOME_TOKENS.border.strong, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as RealProfitPoint | undefined
                if (!point) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={granularity === 'day' ? formatDate(point.bucket) : point.label}
                    entries={[
                      {
                        name: 'Profit real estimat',
                        value: point.value,
                        color: HOME_TOKENS.brand[600],
                        dataKey: 'value',
                      },
                      {
                        name: 'Încasări nete',
                        value: point.netEarnings,
                        color: HOME_TOKENS.border.strong,
                        dataKey: 'netEarnings',
                      },
                    ]}
                  />
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="netEarnings"
              name="Încasări nete"
              stroke="none"
              fill={HOME_TOKENS.border.subtle}
              isAnimationActive={animate}
            />
            {hasNegative && <ReferenceLine y={0} stroke={HOME_TOKENS.border.strong} strokeDasharray="4 4" />}
            <Line
              type="monotone"
              dataKey="value"
              name="Profit real estimat"
              stroke={HOME_TOKENS.brand[600]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={animate}
            />
          </ComposedChart>
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
      </Box>
    </HomeCard>
  )
}
