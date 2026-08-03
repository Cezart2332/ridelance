import { Box, Stack, Typography } from '@mui/material'

import { HOME_TOKENS } from '../tokens'
import { formatDate } from '../format'
import type { DashboardSources } from '../../../../services/pfaDashboard.service'
import { isBoltStale, isUberStale } from '../sourceFreshness'

interface SourcesPillProps {
  sources: DashboardSources
  onOpenSources: () => void
}

/** Ziua de azi se scrie „azi", nu 03.08 — altfel pare o dată veche. */
function relativeDay(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const days = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 864e5,
  )
  if (days <= 0) return 'azi'
  if (days === 1) return 'ieri'
  return formatDate(iso)
}

/**
 * Singurul rest al modulelor de import pe „Acasă": o pastilă de stare care duce în
 * taburile Bolt/Uber din Profil. Verde când ambele surse sunt proaspete, ambră altfel.
 *
 * Cele două date măsoară lucruri diferite — Bolt se sincronizează automat prin API, iar
 * Uber depinde de ultimul CSV încărcat manual — așa că fiecare jumătate spune explicit
 * la ce se referă. Fără eticheta asta, data raportului Uber se citea drept „ultima
 * sincronizare" a întregului dashboard.
 */
export function SourcesPill({ sources, onOpenSources }: SourcesPillProps) {
  const stale = isBoltStale(sources) || isUberStale(sources)
  const tone = stale ? HOME_TOKENS.warn : HOME_TOKENS.pos

  const boltSync = relativeDay(sources.bolt.lastSyncAt)
  const boltText = !sources.bolt.configured
    ? 'Bolt neconectat'
    : !sources.bolt.connected
      ? 'Bolt deconectat'
      : boltSync
        ? `Bolt sincronizat ${boltSync}`
        : 'Bolt nesincronizat'

  const uberReport = relativeDay(sources.uber.lastReportAt)
  const uberText = !sources.uber.connected
    ? 'Uber fără raport'
    : uberReport
      ? `Uber raport ${uberReport}`
      : 'Uber fără raport'

  const fullTitle = [
    sources.bolt.lastSyncAt
      ? `Bolt — ultima sincronizare API: ${new Date(sources.bolt.lastSyncAt).toLocaleString('ro-RO')}`
      : 'Bolt — nesincronizat',
    sources.uber.lastReportAt
      ? `Uber — ultimul raport CSV încărcat: ${formatDate(sources.uber.lastReportAt)}`
      : 'Uber — niciun raport încărcat',
  ].join('\n')

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpenSources}
      title={fullTitle}
      aria-label={`Stare surse de date: ${boltText}, ${uberText}. Deschide sursele din Profil.`}
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
