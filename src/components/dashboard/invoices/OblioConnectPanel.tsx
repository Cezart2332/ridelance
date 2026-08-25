import { useState } from 'react'
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'

import { invoicesService, type OblioConnection } from '../../../services/invoices.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { Panel, StatusChip } from '../ui'

/**
 * Conectarea contului Oblio al proprietarului.
 *
 * Credențialele sunt ale lui, nu ale platformei: RIDElance emite pe CIF-ul ei, aici fiecare
 * emite pe al lui. Cheia API nu se întoarce niciodată de pe server — se poate doar înlocui.
 */
interface OblioConnectPanelProps {
  connection: OblioConnection
  onChanged: () => void
}

export function OblioConnectPanel({ connection, onChanged }: OblioConnectPanelProps) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [cif, setCif] = useState(connection.cif ?? '')
  const [seriesName, setSeriesName] = useState(connection.seriesName ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    setBusy(true)
    setError(null)
    try {
      await invoicesService.connectOblio({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        cif: cif.trim(),
        seriesName: seriesName.trim() || null,
      })
      setClientSecret('')
      onChanged()
    } catch (err) {
      // Serverul verifică credențialele la Oblio înainte să le salveze, deci mesajul lui
      // spune exact ce n-a mers — CIF inexistent în cont, cheie greșită, cont blocat.
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Nu am putut conecta contul Oblio.')
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await invoicesService.disconnectOblio()
      onChanged()
    } catch {
      setError('Nu am putut deconecta contul.')
    } finally {
      setBusy(false)
    }
  }

  if (connection.connected) {
    return (
      <Panel
        title="Cont Oblio"
        subtitle="Facturile se emit pe CIF-ul firmei tale, din contul tău Oblio."
        action={<StatusChip label="Conectat" tone="active" size="sm" outlined />}
      >
        <Stack spacing={1.2}>
          <Detail label="Firmă" value={connection.companyName ?? '—'} />
          <Detail label="CIF" value={connection.cif ?? '—'} />
          <Detail label="Serie implicită" value={connection.seriesName ?? '—'} />

          <Box sx={{ pt: 1 }}>
            <Button
              startIcon={<LinkOffRoundedIcon />}
              disabled={busy}
              onClick={() => void disconnect()}
              sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}
            >
              Deconectează
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}
        </Stack>
      </Panel>
    )
  }

  return (
    <Panel
      title="Conectează Oblio"
      subtitle="Facturile emise apar aici imediat ce contul e legat."
      action={<StatusChip label="Neconectat" tone="neutral" size="sm" outlined />}
    >
      <Stack spacing={2}>
        {(error || connection.errorMessage) && (
          <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
            {error ?? connection.errorMessage}
          </Alert>
        )}

        <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>
          Cheia API se ia din Oblio → Setări → Date cont. O verificăm la conectare, deci dacă e
          greșită afli acum, nu la prima factură.
        </Typography>

        <TextField
          label="Email cont Oblio"
          type="email"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          fullWidth
          size="small"
          sx={dashboardInputSx}
        />
        <TextField
          label="Cheie API"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          fullWidth
          size="small"
          sx={dashboardInputSx}
        />
        <TextField
          label="CIF"
          value={cif}
          onChange={(e) => setCif(e.target.value)}
          fullWidth
          size="small"
          sx={dashboardInputSx}
          helperText="Trebuie să existe între firmele contului Oblio."
        />
        {connection.availableSeries.length > 0 && (
          <TextField
            select
            label="Serie facturi"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {connection.availableSeries.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Box>
          <Button
            variant="contained"
            disableElevation
            disabled={busy || !clientId.trim() || !clientSecret.trim() || !cif.trim()}
            onClick={() => void connect()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            {busy ? 'Se verifică…' : 'Conectează'}
          </Button>
        </Box>
      </Stack>
    </Panel>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  )
}
