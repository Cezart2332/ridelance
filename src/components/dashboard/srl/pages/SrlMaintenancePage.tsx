import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Skeleton, Stack, Typography } from '@mui/material'

import { srlCarPath } from '../../../../config/srlNavigation'
import {
  maintenanceService,
  type MaintenanceEntry,
  type MaintenanceOverview,
} from '../../../../services/maintenance.service'
import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, StatCard, StatusChip } from '../../ui'

/**
 * Mentenanța flotei, ca istoric.
 *
 * Ca la închirieri: intervenția se înregistrează pe mașina care a fost în service, din pagina ei.
 * Aici rămâne privirea de ansamblu — cât s-a cheltuit, ce urmează, pe care mașini — fără nimic de
 * apăsat, în afară de drumul înapoi la mașină.
 *
 * Intervențiile viitoare și cele trecute stau în aceeași listă, ordonate descrescător, fiindcă
 * întrebarea reală a unui administrator de flotă e „ce urmează și ce s-a făcut" — două tabele
 * separate ar fi rupt firul exact acolo unde e util să fie continuu.
 */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SrlMaintenancePage() {
  const [overview, setOverview] = useState<MaintenanceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    maintenanceService
      .getOverview()
      .then((data) => {
        if (!cancelled) setOverview(data)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca mentenanța.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={280} />
      </Stack>
    )
  }

  if (error && !overview) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  const summary = overview?.summary
  const entries = overview?.entries ?? []
  const now = new Date()

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Mentenanță"
        subtitle="Istoric service, costuri și remindere. O intervenție se adaugă din pagina mașinii."
      />

      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Panel dense>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
              Cost mentenanță
            </Typography>
            <Box sx={{ mt: 0.8 }}>
              <Amount value={summary.costLast30DaysBani / 100} unit="lei" size="card" decimals={0} />
            </Box>
            <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.6 }}>
              ultimele 30 de zile
            </Typography>
          </Panel>
          <StatCard label="Intervenții programate" value={String(summary.scheduledCount)} />
          <StatCard label="Remindere active" value={String(summary.activeReminders)} />
          <StatCard label="Vehicule monitorizate" value={String(summary.monitoredCars)} />
        </Box>
      )}

      <Panel title="Programări și istoric" subtitle="Ce urmează și ce s-a făcut, în ordine cronologică.">
        {entries.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 2 }}>
            Nicio intervenție înregistrată. Prima se adaugă din pagina unei mașini.
          </Typography>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <Box component="thead">
                <Box component="tr">
                  {['Intervenție', 'Mașină', 'Data', 'Kilometraj', 'Cost', ''].map((h, i) => (
                    <Box component="th" key={h || i} sx={headSx}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} now={now} />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Panel>
    </Stack>
  )
}

function EntryRow({ entry, now }: { entry: MaintenanceEntry; now: Date }) {
  const scheduled = new Date(entry.performedAtUtc) > now

  return (
    <Box component="tr">
      <Box component="td" sx={cellSx}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink }}>
          {entry.title}
        </Typography>
        {entry.notes && (
          <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
            {entry.notes}
          </Typography>
        )}
      </Box>
      <Box component="td" sx={cellSx}>
        <Typography
          component={RouterLink}
          to={srlCarPath(entry.carId)}
          sx={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: DASHBOARD_TOKENS.textMuted,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline', color: DASHBOARD_TOKENS.accent },
          }}
        >
          {entry.carLabel}
        </Typography>
      </Box>
      <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', fontWeight: 700 }}>
        {formatDate(entry.performedAtUtc)}
      </Box>
      <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
        {entry.mileage != null ? `${entry.mileage.toLocaleString('ro-RO')} km` : '—'}
      </Box>
      <Box component="td" sx={cellSx}>
        <Amount value={entry.costBani / 100} unit="lei" size="row" decimals={0} />
      </Box>
      <Box component="td" sx={cellSx}>
        {scheduled ? (
          <StatusChip label="Programată" tone="warning" size="sm" outlined />
        ) : (
          <ReminderChip entry={entry} now={now} />
        )}
      </Box>
    </Box>
  )
}

/** Reminderul, dacă există. Cel pe kilometraj nu are dată, deci se arată ca prag, nu ca termen. */
function ReminderChip({ entry, now }: { entry: MaintenanceEntry; now: Date }) {
  if (entry.reminderMileage != null) {
    return <StatusChip label={`La ${entry.reminderMileage.toLocaleString('ro-RO')} km`} tone="neutral" size="sm" />
  }

  if (entry.reminderDateUtc) {
    const due = new Date(entry.reminderDateUtc)
    const days = Math.round((due.getTime() - now.getTime()) / 86_400_000)
    if (days < 0) return <StatusChip label="Reminder depășit" tone="error" size="sm" outlined />
    return <StatusChip label={`În ${days} zile`} tone={days <= 14 ? 'warning' : 'neutral'} size="sm" outlined />
  }

  return null
}

const headSx = {
  textAlign: 'left' as const,
  py: 1,
  px: 1.2,
  fontSize: '0.75rem',
  fontWeight: 700,
  color: DASHBOARD_TOKENS.textMuted,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
}

const cellSx = {
  py: 1.3,
  px: 1.2,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
  verticalAlign: 'top' as const,
}
