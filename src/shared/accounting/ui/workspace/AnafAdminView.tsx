import { useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { formatDate } from '../../format'
import { ConfirmDialog, ErrorBlock, LoadingBlock } from '../components'
import { errorMessage, useApi } from '../useApi'
import { startAnafAuthorization, useAnafReturnNotice } from './anafReturn'
import { PageTitle, Panel, StatusPill } from './parts'
import { SpvAppCard } from './SpvAppCard'
import { HAIRLINE, INK, MUTED, type Cell } from './status'

const DARK = { bgcolor: INK, color: '#FFFFFF', '&:hover': { bgcolor: '#2d2d45' } }

/**
 * „ANAF” (doar admin): conexiunile globale, nu ale unui client. Contul ANAF pentru e-Factura
 * (OAuth cu certificatul împuternicitului) și aplicația desktop SPV cu cheile ei.
 */
export function AnafAdminView() {
  useAnafReturnNotice()

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <PageTitle>ANAF</PageTitle>
      <Stack direction={{ xs: 'column', lg: 'row' }} sx={{ gap: 2.5, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
          <AnafAccountCard />
        </Box>
        <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
          <SpvAppCard />
        </Box>
      </Stack>
    </Stack>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 1, borderTop: `1px solid ${HAIRLINE}` }}>
      <Typography sx={{ fontSize: 14, color: MUTED }}>{label}</Typography>
      <Box sx={{ fontSize: 14, color: INK, textAlign: 'right' }}>{children}</Box>
    </Stack>
  )
}

/** Contul ANAF pentru e-Factura: unul singur, folosit pentru toți clienții. */
function AnafAccountCard() {
  const state = useApi(() => accountingApi.anaf.connection(), [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  if (state.error && !state.data) return <ErrorBlock message={state.error} onRetry={state.reload} />
  if (!state.data) return <LoadingBlock />
  const connection = state.data
  const active = connection.status === 'ACTIVE'
  const cell: Cell = active
    ? { tone: 'green', label: 'Conectat' }
    : connection.status === 'EXPIRED'
      ? { tone: 'red', label: 'Expirat' }
      : { tone: 'gray', label: 'Neconectat' }

  const connect = async () => {
    setBusy(true)
    setError(null)
    try {
      await startAnafAuthorization(accountingApi.anaf.start)
    } catch (connectError) {
      setError(errorMessage(connectError))
      setBusy(false)
    }
  }

  return (
    <Panel sx={{ px: 2.5, py: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
          Cont ANAF · e-Factura
        </Typography>
        <StatusPill cell={cell} />
      </Stack>
      {!connection.configured && <Alert severity="warning" sx={{ my: 1 }}>Conexiunea ANAF nu e configurată pe server.</Alert>}
      {connection.connectedBy && <Row label="Conectat de">{connection.connectedBy}</Row>}
      {active && <Row label="Valabil până la">{formatDate(connection.refreshExpiresAtUtc)}</Row>}
      {connection.lastError && <Alert severity="warning" sx={{ mt: 1 }}>{connection.lastError}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      {connection.configured && (
        <Stack direction="row" sx={{ gap: 1, pt: 1.5 }}>
          {active ? (
            <Button variant="outlined" onClick={() => setDisconnecting(true)}>
              Deconectează
            </Button>
          ) : (
            <Button variant="contained" disabled={busy} onClick={() => void connect()} sx={DARK}>
              {busy ? 'Se deschide ANAF…' : connection.status === 'EXPIRED' ? 'Reconectează' : 'Conectează contul ANAF'}
            </Button>
          )}
        </Stack>
      )}

      <ConfirmDialog
        open={disconnecting}
        title="Deconectează contul ANAF"
        message="Sincronizarea e-Factura se oprește pentru toți clienții până la o nouă conectare."
        confirmLabel="Deconectează"
        onClose={() => setDisconnecting(false)}
        onConfirm={async () => {
          await accountingApi.anaf.disconnect()
          state.reload()
        }}
      />
    </Panel>
  )
}
