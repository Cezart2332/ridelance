import { Box, Stack, Typography } from '@mui/material'

import { HOME_TOKENS } from '../tokens'
import { formatPercent } from '../format'
import type { RealProfit } from '../../../../services/pfaDashboard.service'
import { CHART } from './charts/chartTheme'
import { Amount } from './Amount'
import { HomeCard } from './HomeCard'

interface RealProfitCardProps {
  profit: RealProfit
}

interface WaterfallRow {
  label: string
  amount: number
  color: string
  /** Rândul final are separator deasupra și greutate mai mare. */
  isResult?: boolean
}

/**
 * „Profit real estimat" — cardul care rupe confuzia dintre „am încasat" și „am câștigat".
 * Waterfall-ul e proporțional cu cea mai mare valoare absolută, ca barele să fie comparabile.
 */
export function RealProfitCard({ profit }: RealProfitCardProps) {
  const isNegative = profit.value < 0

  const rows: WaterfallRow[] = [
    { label: 'Încasări nete', amount: profit.netEarnings, color: CHART[1] },
    { label: 'Cheltuieli deductibile', amount: -profit.deductibleExpenses, color: CHART[7] },
    { label: 'Taxe estimate', amount: -profit.estimatedTaxes, color: CHART[6] },
    { label: 'Profit real estimat', amount: profit.value, color: CHART[1], isResult: true },
  ]

  const scale = Math.max(...rows.map((row) => Math.abs(row.amount)), 1)

  return (
    <HomeCard
      title="Profit real estimat"
      hint="Încasări nete − cheltuieli deductibile − taxe estimate. Cheltuielile intră doar cu documentul verificat."
      action={
        profit.retentionRatio !== null && !isNegative ? (
          <Box
            sx={{
              flexShrink: 0,
              px: 1.4,
              py: 0.6,
              borderRadius: HOME_TOKENS.radius.pill,
              bgcolor: HOME_TOKENS.brand[50],
              color: HOME_TOKENS.brand[600],
              fontSize: '0.78rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {formatPercent(profit.retentionRatio)} din încasări îți rămân
          </Box>
        ) : undefined
      }
    >
      <Amount
        value={profit.value}
        unit="lei"
        size="hero"
        color={isNegative ? HOME_TOKENS.neg[600] : HOME_TOKENS.text.primary}
      />
      <Typography sx={{ fontSize: 12, color: HOME_TOKENS.text.tertiary, mt: 0.3 }}>
        încasări nete − cheltuieli deductibile − taxe estimate
      </Typography>

      {isNegative && (
        <Typography sx={{ fontSize: '0.78rem', color: HOME_TOKENS.neg[600], mt: 0.8 }}>
          Pe perioada asta cheltuielile și taxele estimate depășesc încasările.
        </Typography>
      )}

      <Stack spacing={1.4} sx={{ mt: 2.2 }}>
        {rows.map((row) => (
          <Box
            key={row.label}
            sx={{
              pt: row.isResult ? 1.4 : 0,
              borderTop: row.isResult ? `1px solid ${HOME_TOKENS.border.subtle}` : 'none',
            }}
          >
            <Stack
              direction="row"
              spacing={1.2}
              sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 0.6 }}
            >
              <Typography
                noWrap
                sx={{
                  fontSize: '0.83rem',
                  fontWeight: row.isResult ? 600 : 400,
                  color: row.isResult ? HOME_TOKENS.text.primary : HOME_TOKENS.text.secondary,
                }}
              >
                {row.label}
              </Typography>
              <Amount
                value={row.amount}
                unit="lei"
                size="row"
                weight={row.isResult ? 600 : 500}
                color={row.amount < 0 ? HOME_TOKENS.neg[600] : HOME_TOKENS.text.primary}
                sx={{ flexShrink: 0 }}
              />
            </Stack>
            <Box
              aria-hidden
              sx={{ height: 8, borderRadius: HOME_TOKENS.radius.pill, bgcolor: HOME_TOKENS.bg.surface2 }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${(Math.abs(row.amount) / scale) * 100}%`,
                  borderRadius: HOME_TOKENS.radius.pill,
                  bgcolor: row.color,
                  opacity: row.isResult || row.amount >= 0 ? 1 : 0.8,
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </HomeCard>
  )
}
