import { useEffect, useState } from 'react'
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { PageHeader, StatusChip } from '../../ui'
import { pfaConnectionsService, type OblioConnection } from '../../../../services/pfaConnections.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

const STATUS_LABEL: Record<OblioConnection['status'], string> = {
  Pending: 'Neconectat',
  Requested: 'În curs de activare',
  Active: 'Conectat',
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Conexiuni → OBLIO, ca hub al conexiunii clientului.
 *
 * Ce se afișează sunt datele PFA-ului și starea contului lui Oblio. Configurația `Oblio`
 * din backend e contul de facturare al RIDElance, din care se emit facturi *către* clienți —
 * firma și CUI-ul de acolo nu au ce căuta pe pagina clientului.
 */
export function OblioConnectionPage() {
  const [connection, setConnection] = useState<OblioConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    pfaConnectionsService
      .getOblio()
      .then((data) => {
        if (!cancelled) setConnection(data)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(getErrorMessage(cause, 'Nu am putut încărca starea conexiunii OBLIO.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const rows = connection
    ? [
        { label: 'Firmă / PFA', value: connection.companyName ?? '—' },
        { label: 'CUI', value: connection.cui ?? '—' },
        { label: 'Cont OBLIO', value: connection.accountEmail ?? '—' },
        { label: 'Consimțăminte', value: connection.consentsAccepted ? 'Acceptate' : 'Neacceptate' },
        { label: 'Acceptate la', value: formatDateTime(connection.consentsAcceptedAtUtc) },
        { label: 'Ultima sincronizare', value: formatDateTime(connection.lastSyncAtUtc) },
      ]
    : []

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader title="OBLIO" subtitle="Contul de facturare OBLIO legat de PFA-ul tău." />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <ReceiptLongRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, flex: 1 }}>Status conexiune</Typography>
          {connection && (
            <StatusChip
              tone={connection.connected ? 'active' : 'neutral'}
              label={STATUS_LABEL[connection.status]}
            />
          )}
        </Stack>

        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Stack>
        ) : error ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.85rem' }}>{error}</Typography>
        ) : (
          <Box>
            {rows.map((row, index) => (
              <Stack
                key={row.label}
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 2,
                  py: 1.2,
                  borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
                }}
              >
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', flexShrink: 0 }}>
                  {row.label}
                </Typography>
                <Typography
                  sx={{
                    color: DASHBOARD_TOKENS.ink,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textAlign: 'right',
                    wordBreak: 'break-word',
                    minWidth: 0,
                  }}
                >
                  {row.value}
                </Typography>
              </Stack>
            ))}
          </Box>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.02),
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.8 }}>
          Documente și facturi sincronizate
        </Typography>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
          Seriile de facturare, documentele emise și clienții vor apărea aici pe măsură ce sunt expuse
          prin API-ul OBLIO.
        </Typography>
      </Paper>
    </Stack>
  )
}
