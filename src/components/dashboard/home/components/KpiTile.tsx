import { Box, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

import { HOME_TOKENS, tabularNums, toneColors, type HomeTone } from '../tokens'
import { useCountUp } from '../useCountUp'
import type { DashboardMetric } from '../../../../services/pfaDashboard.service'
import { DeltaBadge } from './DeltaBadge'

export interface KpiTileProps {
  icon: SvgIconComponent
  label: string
  metric: DashboardMetric
  /** Formatarea e a apelantului: fiecare KPI are unitatea lui. */
  format: (value: number) => string
  subtext: string
  tone: HomeTone
  /** Comisioanele în creștere sunt o veste proastă — inversează culoarea deltei. */
  invertDelta?: boolean
  comparisonLabel: string
}

/**
 * Un singur tile pentru toate cele șase valori din rândul A. Înălțime fixă pe desktop,
 * ca grid-ul să se alinieze; sub 768px devine compact (label + valoare pe un rând).
 */
export function KpiTile({
  icon: Icon,
  label,
  metric,
  format,
  subtext,
  tone,
  invertDelta,
  comparisonLabel,
}: KpiTileProps) {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'))
  const colors = toneColors(tone)
  const displayedValue = useCountUp(metric.value)

  if (isCompact) {
    return (
      <Paper elevation={0} sx={{ ...tileSurfaceSx, height: 88, justifyContent: 'center' }}>
        <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center' }}>
          <Box sx={{ ...iconBoxSx, bgcolor: colors.bg, color: colors.fg }}>
            <Icon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 500, color: HOME_TOKENS.text.secondary }}>
              {label}
            </Typography>
            <Typography
              sx={{ ...tabularNums, fontSize: '1.2rem', fontWeight: 600, color: HOME_TOKENS.text.primary }}
            >
              {format(displayedValue)}
            </Typography>
          </Box>
          <DeltaBadge
            value={metric.value}
            previous={metric.previous}
            invert={invertDelta}
            comparisonLabel={comparisonLabel}
          />
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper elevation={0} sx={{ ...tileSurfaceSx, height: 140 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.8 }}>
        <Box sx={{ ...iconBoxSx, bgcolor: colors.bg, color: colors.fg }}>
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <DeltaBadge
          value={metric.value}
          previous={metric.previous}
          invert={invertDelta}
          comparisonLabel={comparisonLabel}
        />
      </Stack>

      <Typography sx={{ fontSize: '0.81rem', fontWeight: 500, color: HOME_TOKENS.text.secondary }}>
        {label}
      </Typography>
      <Typography
        sx={{
          ...tabularNums,
          fontSize: '1.5rem',
          lineHeight: 1.2,
          fontWeight: 600,
          color: HOME_TOKENS.text.primary,
          mt: 0.2,
        }}
      >
        {format(displayedValue)}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.72rem',
          color: HOME_TOKENS.text.tertiary,
          mt: 'auto',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={subtext}
      >
        {subtext}
      </Typography>
    </Paper>
  )
}

const tileSurfaceSx = {
  p: 1.75,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: HOME_TOKENS.radius.tile,
  border: `1px solid ${HOME_TOKENS.border.subtle}`,
  bgcolor: HOME_TOKENS.bg.surface,
  boxShadow: HOME_TOKENS.shadow.card,
  minWidth: 0,
} as const

const iconBoxSx = {
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: '10px',
  display: 'grid',
  placeItems: 'center',
} as const
