import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { HOME_TOKENS, tabularNums } from '../../tokens'
import { formatAxisNumber, formatCurrency, formatDate } from '../../format'
import type { NetEarningsPoint } from '../../../../../services/pfaDashboard.service'
import { HomeCard } from '../HomeCard'
import { ChartDataTable, ChartTooltip } from './chartSetup'
import { axisProps, gridProps } from './chartTheme'

interface NetEarningsChartProps {
  points: NetEarningsPoint[]
  total: number
  granularity: 'day' | 'month'
  /** Dezactivează animația de intrare la re-render din filtre (spec §7). */
  animate: boolean
}

/**
 * „Încasări nete pe zile". Implicit o singură arie totală — homepage-ul rămâne curat;
 * împărțirea pe platforme e la un toggle distanță.
 */
export function NetEarningsChart({ points, total, granularity, animate }: NetEarningsChartProps) {
  const [split, setSplit] = useState(false)

  return (
    <HomeCard
      title="Încasări nete"
      subtitle={
        <Box component="span" sx={tabularNums}>
          {formatCurrency(total)} în perioada selectată
        </Box>
      }
      action={
        <Box
          component="button"
          type="button"
          aria-pressed={split}
          onClick={() => setSplit((previous) => !previous)}
          sx={{
            flexShrink: 0,
            px: 1.2,
            py: 0.6,
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            borderRadius: HOME_TOKENS.radius.pill,
            border: `1px solid ${split ? HOME_TOKENS.brand[600] : HOME_TOKENS.border.subtle}`,
            bgcolor: split ? HOME_TOKENS.brand[50] : HOME_TOKENS.bg.surface,
            color: split ? HOME_TOKENS.brand[600] : HOME_TOKENS.text.secondary,
            '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
          }}
        >
          Împarte pe platforme
        </Box>
      }
      fill
    >
      <Box
        role="img"
        aria-label={`Evoluția încasărilor nete pe perioada selectată, total ${formatCurrency(total)}`}
        sx={{ position: 'relative', height: 260, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="netEarningsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HOME_TOKENS.brand[600]} stopOpacity={0.22} />
                <stop offset="100%" stopColor={HOME_TOKENS.brand[600]} stopOpacity={0} />
              </linearGradient>
            </defs>
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
                const point = payload?.[0]?.payload as NetEarningsPoint | undefined
                if (!point) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={granularity === 'day' ? formatDate(point.bucket) : point.label}
                    entries={
                      split
                        ? [
                            { name: 'Bolt', value: point.bolt, color: HOME_TOKENS.platform.bolt, dataKey: 'bolt' },
                            { name: 'Uber', value: point.uber, color: HOME_TOKENS.platform.uber, dataKey: 'uber' },
                          ]
                        : [
                            { name: 'Net total', value: point.total, color: HOME_TOKENS.brand[600], dataKey: 'total' },
                            { name: 'Bolt', value: point.bolt, color: HOME_TOKENS.platform.bolt, dataKey: 'bolt' },
                            { name: 'Uber', value: point.uber, color: HOME_TOKENS.platform.uber, dataKey: 'uber' },
                          ]
                    }
                    footer={point.rides > 0 ? `${point.rides} curse` : undefined}
                  />
                )
              }}
            />
            {split ? (
              <>
                <Area
                  type="monotone"
                  dataKey="bolt"
                  name="Bolt"
                  stroke={HOME_TOKENS.platform.bolt}
                  strokeWidth={2}
                  fill={HOME_TOKENS.platform.bolt}
                  fillOpacity={0.14}
                  dot={false}
                  isAnimationActive={animate}
                />
                <Area
                  type="monotone"
                  dataKey="uber"
                  name="Uber"
                  stroke={HOME_TOKENS.platform.uber}
                  strokeWidth={2}
                  fill={HOME_TOKENS.platform.uber}
                  fillOpacity={0.1}
                  dot={false}
                  isAnimationActive={animate}
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="total"
                name="Net total"
                stroke={HOME_TOKENS.brand[600]}
                strokeWidth={2}
                fill="url(#netEarningsFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={animate}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption="Încasări nete pe perioada selectată"
          columns={['Perioadă', 'Bolt', 'Uber', 'Total', 'Curse']}
          rows={points.map((point) => [point.label, point.bolt, point.uber, point.total, point.rides])}
        />
      </Box>

      {points.length === 0 && (
        <Stack sx={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <Typography sx={{ fontSize: '0.85rem', color: HOME_TOKENS.text.tertiary }}>
            Nicio cursă în perioada selectată.
          </Typography>
        </Stack>
      )}
    </HomeCard>
  )
}
