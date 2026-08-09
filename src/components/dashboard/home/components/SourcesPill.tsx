import { Box, Stack, Tooltip, Typography } from '@mui/material'

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

/** „15.07" — doar ziua și luna încap pe o pastilă; anul îl dă tooltipul. */
function shortDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })
}

/**
 * Starea surselor de date (spec §2.3), într-o singură pastilă discretă.
 *
 * Era o pastilă lată colorată integral, cu două propoziții înghesuite — greutate vizuală de
 * alertă pentru o informație de rutină. Acum culoarea e strânsă într-un punct de 6px, iar
 * eticheta spune un singur lucru: totul e la zi, sau care sursă a rămas în urmă.
 *
 * Cele două date măsoară lucruri diferite — Bolt se sincronizează automat prin API, iar Uber
 * depinde de ultimul CSV încărcat manual — așa că detaliul complet, cu ambele, stă în
 * tooltip. Ăsta e și motivul pentru care înlocuiește bannerul galben: aceeași informație,
 * fără să împingă KPI-urile sub fold.
 */
export function SourcesPill({ sources, onOpenSources }: SourcesPillProps) {
  const boltStale = isBoltStale(sources)
  const uberStale = isUberStale(sources)
  const stale = boltStale || uberStale
  const dotColor = stale ? HOME_TOKENS.warn[600] : HOME_TOKENS.pos[600]

  // Eticheta numește sursa problematică, fiindcă altfel utilizatorul nu știe unde să intre.
  const label = boltStale
    ? `Bolt: ${shortDate(sources.bolt.lastSyncAt) ?? 'nesincronizat'}`
    : uberStale
      ? `Uber: ${shortDate(sources.uber.lastReportAt) ?? 'fără raport'}`
      : `Sincronizat ${relativeDay(sources.bolt.lastSyncAt ?? sources.uber.lastReportAt) ?? 'recent'}`

  const detail = [
    sources.bolt.configured
      ? sources.bolt.lastSyncAt
        ? `Bolt — ultima sincronizare API: ${new Date(sources.bolt.lastSyncAt).toLocaleString('ro-RO')}`
        : 'Bolt — nesincronizat'
      : 'Bolt — neconectat',
    sources.uber.connected
      ? sources.uber.lastReportAt
        ? `Uber — ultimul raport CSV încărcat: ${formatDate(sources.uber.lastReportAt)}`
        : 'Uber — niciun raport încărcat'
      : 'Uber — neconectat',
  ].join('\n')

  return (
    <Tooltip
      enterTouchDelay={0}
      title={<Box sx={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>{detail}</Box>}
    >
      <Box
        component="button"
        type="button"
        onClick={onOpenSources}
        aria-label={`Stare surse de date. ${detail.replace(/\n/g, '. ')}. Deschide sursele din Profil.`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.8,
          px: 1.2,
          py: 0.5,
          flexShrink: 0,
          cursor: 'pointer',
          borderRadius: HOME_TOKENS.radius.pill,
          border: `1px solid ${HOME_TOKENS.border.subtle}`,
          bgcolor: HOME_TOKENS.bg.surface,
          transition: 'box-shadow 160ms ease-out, border-color 160ms ease-out',
          '&:hover': {
            boxShadow: HOME_TOKENS.shadow.raised,
            borderColor: HOME_TOKENS.border.strong,
          },
          '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Box
          aria-hidden
          sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }}
        />
        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              color: HOME_TOKENS.text.secondary,
            }}
          >
            {label}
          </Typography>
        </Stack>
      </Box>
    </Tooltip>
  )
}
