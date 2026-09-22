import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { HOME_TOKENS, tabularNums } from '../../tokens'
import { formatAxisNumber, formatCurrency } from '../../format'
import type { NetEarningsPoint, ChartGranularity } from '../../../../../services/pfaDashboard.service'
import { HomeCard } from '../HomeCard'
import { ChartDataTable, ChartTooltip } from './chartSetup'
import { BAR_RADIUS, barFill, bucketTitle, useActiveBar, barXAxisProps } from './barChart'
import { axisProps, CHART, gridProps, PLATFORM_COLOR } from './chartTheme'
import { ChartFrame } from './ChartFrame'

interface NetEarningsChartProps {
  points: NetEarningsPoint[]
  total: number
  granularity: ChartGranularity
  /** Dezactivează animația de intrare la re-render din filtre (spec §7). */
  animate: boolean
}

/**
 * „Încasări nete": câte o bară pe zi (săptămâna), pe săptămână (luna) sau pe lună (anul).
 * Implicit o singură serie totală — homepage-ul rămâne curat; împărțirea pe platforme, ca bare
 * suprapuse, e la un toggle distanță.
 */
export function NetEarningsChart({ points, total, granularity, animate }: NetEarningsChartProps) {
  const [split, setSplit] = useState(false)
  const activeBar = useActiveBar()

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
      <ChartFrame height={260} ariaLabel={`Evoluția încasărilor nete pe perioada selectată, total ${formatCurrency(total)}`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="28%"
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
                const point = payload?.[0]?.payload as NetEarningsPoint | undefined
                if (!point) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={bucketTitle(granularity, point.bucket, point.label)}
                    entries={
                      split
                        ? [
                            { name: 'Bolt', value: point.bolt, color: PLATFORM_COLOR.bolt, dataKey: 'bolt' },
                            { name: 'Uber', value: point.uber, color: PLATFORM_COLOR.uber, dataKey: 'uber' },
                          ]
                        : [
                            { name: 'Net total', value: point.total, color: CHART[1], dataKey: 'total' },
                            { name: 'Bolt', value: point.bolt, color: PLATFORM_COLOR.bolt, dataKey: 'bolt' },
                            { name: 'Uber', value: point.uber, color: PLATFORM_COLOR.uber, dataKey: 'uber' },
                          ]
                    }
                    footer={point.rides > 0 ? `${point.rides} curse` : undefined}
                  />
                )
              }}
            />
            {split ? (
              <>
                <Bar dataKey="bolt" name="Bolt" stackId="platforms" maxBarSize={36} isAnimationActive={animate}>
                  {points.map((point, index) => (
                    <Cell key={point.bucket} fill={barFill(PLATFORM_COLOR.bolt, index, activeBar.active)} />
                  ))}
                </Bar>
                <Bar dataKey="uber" name="Uber" stackId="platforms" maxBarSize={36} radius={[8, 8, 0, 0]} isAnimationActive={animate}>
                  {points.map((point, index) => (
                    <Cell key={point.bucket} fill={barFill(PLATFORM_COLOR.uber, index, activeBar.active)} />
                  ))}
                </Bar>
              </>
            ) : (
              <Bar dataKey="total" name="Net total" radius={BAR_RADIUS} maxBarSize={36} isAnimationActive={animate}>
                {points.map((point, index) => (
                  <Cell key={point.bucket} fill={barFill(CHART[1], index, activeBar.active)} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption="Încasări nete pe perioada selectată"
          columns={['Perioadă', 'Bolt', 'Uber', 'Total', 'Curse']}
          rows={points.map((point) => [point.label, point.bolt, point.uber, point.total, point.rides])}
        />
      </ChartFrame>

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
