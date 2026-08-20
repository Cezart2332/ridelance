import { Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'

import { HOME_TOKENS, SPLIT_ROW } from '../tokens'
import { useCountUp } from '../useCountUp'
import type { DashboardMetric } from '../../../../services/pfaDashboard.service'
import { Amount } from '../../ui/Amount'
import { DeltaBadge } from './DeltaBadge'

export interface KpiTileProps {
  label: string
  metric: DashboardMetric
  /** `lei`, `h`, `km`, `lei/h` — unitatea se randează la jumătate din dimensiunea cifrei. */
  unit: string
  /** Orele și kilometrii cer o zecimală; banii, două. */
  decimals?: number
  subtext: string
  /** Comisioanele în creștere sunt o veste proastă — inversează culoarea deltei. */
  invertDelta?: boolean
  comparisonLabel: string
}

/**
 * Un singur tile pentru toate cele șase valori din rândul de sus (spec §6.2).
 *
 * **Nu are iconiță.** Pătratul colorat din colț consuma 40px pe verticală ca să repete o
 * informație care e deja în label, și exact de asta cifrele nu aveau aer. Referința nu are
 * iconițe pe KPI-uri; ierarhia o fac dimensiunea și spațiul.
 *
 * Ordinea e fixă: label (cu delta pe aceeași linie de bază) → valoare → caption.
 */
export function KpiTile({
  label,
  metric,
  unit,
  decimals = 2,
  subtext,
  invertDelta,
  comparisonLabel,
}: KpiTileProps) {
  const theme = useTheme()
  // Sub 600px tile-urile stau două pe rând, deci au ~170px lățime: 30px ar rupe „3.625,00 lei"
  // pe două rânduri sau l-ar tăia.
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'))
  const displayedValue = useCountUp(metric.value)

  return (
    <Paper
      elevation={0}
      sx={{
        p: '20px',
        minHeight: 118,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        borderRadius: HOME_TOKENS.radius.tile,
        border: `1px solid ${HOME_TOKENS.border.subtle}`,
        bgcolor: HOME_TOKENS.bg.surface,
        boxShadow: HOME_TOKENS.shadow.card,
        transition: 'box-shadow 160ms ease-out',
        '&:hover': { boxShadow: HOME_TOKENS.shadow.hover },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {/* Delta stă pe linia de bază a label-ului, nu centrată pe card: altfel plutește
          în dreptul cifrei și pare că o comentează pe ea, nu perioada. */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'baseline',
          justifyContent: 'space-between',
          // Doar în layout-ul cu trei tile-uri pe coloana de span 7 eticheta chiar se rupe pe
          // două rânduri („Comision platforme" la ~200px). Acolo rezervăm înălțimea, ca valorile
          // să rămână aliniate între tile-uri; în rest ar fi doar gol.
          [SPLIT_ROW]: { minHeight: 36 },
        }}
      >
        <Typography
          sx={{ fontSize: 13, lineHeight: 1.4, fontWeight: 500, color: HOME_TOKENS.text.secondary }}
        >
          {label}
        </Typography>
        <DeltaBadge
          value={metric.value}
          previous={metric.previous}
          invert={invertDelta}
          comparisonLabel={comparisonLabel}
        />
      </Stack>

      <Amount
        value={displayedValue}
        unit={unit}
        decimals={decimals}
        size={isCompact ? 'card' : 'kpi'}
        sx={{ mt: '12px' }}
      />

      <Typography
        title={subtext}
        sx={{
          mt: '6px',
          fontSize: 12,
          lineHeight: 1.4,
          color: HOME_TOKENS.text.tertiary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {subtext}
      </Typography>
    </Paper>
  )
}
