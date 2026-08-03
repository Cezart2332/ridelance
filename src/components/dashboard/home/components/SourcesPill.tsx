import { Box, Stack, Typography } from '@mui/material'

import { HOME_TOKENS } from '../tokens'
import { formatDate } from '../format'
import type { DashboardSources } from '../../../../services/pfaDashboard.service'
import { isBoltStale, isUberStale } from '../sourceFreshness'

interface SourcesPillProps {
  sources: DashboardSources
  onOpenPlatforms: () => void
}

/**
 * Singurul rest al modulelor de import pe „Acasă": o pastilă de stare care duce în
 * secțiunea Platforme. Verde când ambele surse sunt proaspete, ambră altfel.
 */
export function SourcesPill({ sources, onOpenPlatforms }: SourcesPillProps) {
  const stale = isBoltStale(sources) || isUberStale(sources)
  const tone = stale ? HOME_TOKENS.warn : HOME_TOKENS.pos

  const boltText = !sources.bolt.configured
    ? 'Bolt neconectat'
    : isBoltStale(sources)
      ? 'Bolt nesincronizat'
      : 'Bolt sincronizat'

  const uberText = !sources.uber.connected
    ? 'Uber fără raport'
    : `Uber ${sources.uber.lastReportAt ? formatDate(sources.uber.lastReportAt) : ''}`.trim()

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpenPlatforms}
      aria-label={`Stare surse de date: ${boltText}, ${uberText}. Deschide secțiunea Platforme.`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.8,
        px: 1.3,
        py: 0.6,
        cursor: 'pointer',
        borderRadius: HOME_TOKENS.radius.pill,
        border: `1px solid ${HOME_TOKENS.border.subtle}`,
        bgcolor: tone[50],
        transition: 'box-shadow 180ms ease-out',
        '&:hover': { boxShadow: HOME_TOKENS.shadow.card },
        '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Box aria-hidden sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: tone[600], flexShrink: 0 }} />
      <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: tone[600], whiteSpace: 'nowrap' }}>
          {boltText}
        </Typography>
        <Typography sx={{ fontSize: '0.76rem', color: HOME_TOKENS.text.tertiary }}>•</Typography>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: tone[600], whiteSpace: 'nowrap' }}>
          {uberText}
        </Typography>
      </Stack>
    </Box>
  )
}
