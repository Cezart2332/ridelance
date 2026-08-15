import { useMemo } from 'react'
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { PageHeader, StatusChip } from '../../ui'
import { PlatformAccountsPanel } from './PlatformAccountsPanel'
import { useDashboardSummary } from '../../home/useDashboardData'

/** Luna curentă — pagina are nevoie doar de blocul `sources`, nu de un interval anume. */
function currentMonthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const iso = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { from: iso(first), to: iso(last) }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Conexiuni → Uber.
 *
 * Uber nu are integrarea API folosită la Bolt: datele vin din rapoartele CSV, iar importul
 * e o operațiune de back-office (`POST /uber/imports/{id}` cere `ManageClientIncome`, cu
 * rapoartele trimise la birou). Aici arătăm deci ce s-a importat, nu un formular de upload
 * pe care clientul nu are dreptul să-l trimită.
 */
export function UberConnectionPage() {
  const range = useMemo(() => currentMonthRange(), [])
  const { data, isLoading, error } = useDashboardSummary({
    from: range.from,
    to: range.to,
    platform: 'all',
    payment: 'all',
  })

  const uber = data?.sources.uber

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader title="Uber" subtitle="Datele importate din rapoartele Uber și conturile tale Uber." />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <UploadFileRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, flex: 1 }}>Import date Uber</Typography>
          {!isLoading && (
            <StatusChip
              tone={uber?.connected ? 'active' : 'neutral'}
              label={uber?.connected ? 'Date importate' : 'Fără import'}
            />
          )}
        </Stack>

        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
          Rapoartele Uber ajung la echipa RIDElance, care le încarcă în platformă. Aici vezi ce a intrat
          ultima dată în calcule.
        </Typography>

        {isLoading ? (
          <Stack sx={{ alignItems: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Stack>
        ) : error ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.85rem' }}>{error}</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            {[
              { label: 'Ultimul import', value: formatDate(uber?.lastReportAt) },
              { label: 'Perioada acoperită', value: uber?.detectedRange ?? '—' },
            ].map((row) => (
              <Box
                key={row.label}
                sx={{
                  p: 2,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.02),
                }}
              >
                <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.75rem' }}>
                  {row.label}
                </Typography>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1rem', mt: 0.4 }}>
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <PlatformAccountsPanel provider="Uber" />
    </Stack>
  )
}
