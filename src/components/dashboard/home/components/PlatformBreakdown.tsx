import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { HOME_TOKENS, tabularNums } from '../tokens'
import { formatCurrency } from '../format'
import type { PlatformSplitRow } from '../../../../services/pfaDashboard.service'
import { PLATFORM_COLOR } from './charts/chartTheme'
import { Amount } from './Amount'
import { HomeCard } from './HomeCard'

const PLATFORM_LABEL: Record<string, string> = { bolt: 'Bolt', uber: 'Uber' }

interface PlatformBreakdownProps {
  rows: PlatformSplitRow[]
  animate: boolean
}

/**
 * „De unde vin banii" — doar distribuția, fără să repete tile-urile de sus.
 * La patru coloane tabelul ar deveni ilizibil pe 4 coloane de grid, așa că
 * Cash/Card stau sub un toggle în locul perechii Comision/Curse.
 */
export function PlatformBreakdown({ rows, animate }: PlatformBreakdownProps) {
  const [showPaymentSplit, setShowPaymentSplit] = useState(false)

  const total = rows.reduce(
    (accumulator, row) => ({
      net: accumulator.net + row.net,
      fees: accumulator.fees + row.fees,
      cash: accumulator.cash + row.cash,
      card: accumulator.card + row.card,
      rides: accumulator.rides + row.rides,
    }),
    { net: 0, fees: 0, cash: 0, card: 0, rides: 0 },
  )

  const donutData = rows.filter((row) => row.net > 0)

  return (
    <HomeCard
      title="De unde vin banii"
      action={
        <Box
          component="button"
          type="button"
          aria-pressed={showPaymentSplit}
          onClick={() => setShowPaymentSplit((previous) => !previous)}
          sx={{
            flexShrink: 0,
            px: 1.2,
            py: 0.6,
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            borderRadius: HOME_TOKENS.radius.pill,
            border: `1px solid ${showPaymentSplit ? HOME_TOKENS.brand[600] : HOME_TOKENS.border.subtle}`,
            bgcolor: showPaymentSplit ? HOME_TOKENS.brand[50] : HOME_TOKENS.bg.surface,
            color: showPaymentSplit ? HOME_TOKENS.brand[600] : HOME_TOKENS.text.secondary,
            '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
          }}
        >
          Cash / Card
        </Box>
      }
      fill
    >
      <Box
        role="img"
        aria-label={rows
          .map((row) => `${PLATFORM_LABEL[row.platform]} ${formatCurrency(row.net)} net`)
          .join(', ')}
        sx={{ position: 'relative', height: 168, width: '100%' }}
      >
        {donutData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              {/* Inel de 12px: la 14px masa de culoare concura cu cifra din centru, care e
                  de fapt informația principală. */}
              <Pie
                data={donutData}
                dataKey="net"
                nameKey="platform"
                innerRadius={56}
                outerRadius={68}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={animate}
              >
                {donutData.map((row) => (
                  <Cell
                    key={row.platform}
                    fill={row.platform === 'bolt' ? PLATFORM_COLOR.bolt : PLATFORM_COLOR.uber}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '0.83rem', color: HOME_TOKENS.text.tertiary }}>
              Nicio încasare în perioada selectată.
            </Typography>
          </Stack>
        )}

        {donutData.length > 0 && (
          <Stack
            sx={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: HOME_TOKENS.text.tertiary,
              }}
            >
              Net total
            </Typography>
            <Amount value={total.net} unit="lei" size="card" />
          </Stack>
        )}
      </Box>

      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 1.6 }}>
        <Box component="caption" sx={visuallyHidden}>
          Distribuția încasărilor pe platforme
        </Box>
        <Box component="thead">
          <Box component="tr">
            <Box component="th" scope="col" sx={headCellSx}>
              Platformă
            </Box>
            {/* Unitatea stă în antet, nu pe fiecare rând: la 14px, un „lei" randat la
                jumătate ar fi ilizibil, iar repetat de opt ori ar îneca cifrele. */}
            <Box component="th" scope="col" sx={{ ...headCellSx, textAlign: 'right' }}>
              Net (lei)
            </Box>
            <Box component="th" scope="col" sx={{ ...headCellSx, textAlign: 'right' }}>
              {showPaymentSplit ? 'Cash (lei)' : 'Comision (lei)'}
            </Box>
            <Box component="th" scope="col" sx={{ ...headCellSx, textAlign: 'right' }}>
              {showPaymentSplit ? 'Card (lei)' : 'Curse'}
            </Box>
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((row) => (
            <Box component="tr" key={row.platform}>
              <Box component="td" sx={bodyCellSx}>
                <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: row.platform === 'bolt' ? PLATFORM_COLOR.bolt : PLATFORM_COLOR.uber,
                    }}
                  />
                  <span>{PLATFORM_LABEL[row.platform] ?? row.platform}</span>
                </Stack>
              </Box>
              <Box component="td" sx={numericCellSx}>
                <Amount value={row.net} size="row" weight={500} />
              </Box>
              <Box component="td" sx={numericCellSx}>
                <Amount value={showPaymentSplit ? row.cash : row.fees} size="row" weight={500} />
              </Box>
              <Box component="td" sx={numericCellSx}>
                {showPaymentSplit ? (
                  <Amount value={row.card} size="row" weight={500} />
                ) : (
                  <Amount value={row.rides} size="row" weight={500} decimals={0} />
                )}
              </Box>
            </Box>
          ))}
          <Box component="tr">
            <Box component="td" sx={{ ...bodyCellSx, fontWeight: 600, borderBottom: 'none' }}>
              Total
            </Box>
            <Box component="td" sx={{ ...numericCellSx, borderBottom: 'none' }}>
              <Amount value={total.net} size="row" />
            </Box>
            <Box component="td" sx={{ ...numericCellSx, borderBottom: 'none' }}>
              <Amount value={showPaymentSplit ? total.cash : total.fees} size="row" />
            </Box>
            <Box component="td" sx={{ ...numericCellSx, borderBottom: 'none' }}>
              {showPaymentSplit ? (
                <Amount value={total.card} size="row" />
              ) : (
                <Amount value={total.rides} size="row" decimals={0} />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </HomeCard>
  )
}

const headCellSx = {
  py: 0.8,
  fontSize: '0.68rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  textAlign: 'left',
  color: HOME_TOKENS.text.tertiary,
  borderBottom: `1px solid ${HOME_TOKENS.border.subtle}`,
} as const

const bodyCellSx = {
  py: 1,
  fontSize: '0.83rem',
  color: HOME_TOKENS.text.primary,
  borderBottom: `1px solid ${HOME_TOKENS.border.subtle}`,
} as const

const numericCellSx = {
  ...bodyCellSx,
  ...tabularNums,
  textAlign: 'right',
} as const
