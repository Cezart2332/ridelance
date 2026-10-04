import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

import { DASHBOARD_TOKENS as T } from '../../dashboardTheme'
import { PageHeader, StatusChip } from '../../ui'
import { fiscalLinkService, type FiscalLinkAccountingSync, type FiscalLinkConnection, type FiscalLinkRegister } from '../../../../services/fiscalLink.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: `${T.radius.lg}px`,
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow.sm,
}

function registerState(register: FiscalLinkRegister): { label: string; tone: 'active' | 'warning' | 'neutral' } {
  if (register.awaitingClientConsent) return { label: 'Așteaptă confirmarea', tone: 'warning' }
  if (register.status !== 'Active') return { label: register.status || 'Inactivă', tone: 'neutral' }
  return register.isOnline ? { label: 'Online', tone: 'active' } : { label: 'Offline', tone: 'neutral' }
}

/**
 * Conexiuni → FiscalLink. „Conectează” face PFA-ul client FiscalLink; codul de activare se
 * introduce apoi în aplicația FiscalLink, iar casele activate apar aici singure.
 */
export function FiscalLinkConnectionPage() {
  const [connection, setConnection] = useState<FiscalLinkConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [sync, setSync] = useState<FiscalLinkAccountingSync | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const fetchConnection = useCallback(() =>
    fiscalLinkService.get()
      .then((current) => { setConnection(current); setError('') })
      .catch((err) => setError(getErrorMessage(err, 'Nu am putut încărca conexiunea FiscalLink.')))
      .finally(() => setLoading(false)), [])

  useEffect(() => { void fetchConnection() }, [fetchConnection])

  const fetchSync = useCallback(() => fiscalLinkService.getAccountingSync()
    .then((value) => { setSync(value); setSyncError('') })
    .catch((err) => setSyncError(getErrorMessage(err, 'Nu am putut încărca starea sincronizării contabile.'))), [])

  useEffect(() => { if (connection?.connected) void fetchSync() }, [connection?.connected, fetchSync])

  const synchronize = async () => {
    setSyncing(true)
    setSyncError('')
    try {
      setSync(await fiscalLinkService.syncAccounting())
    } catch (err) {
      setSyncError(getErrorMessage(err, 'Sincronizarea documentelor fiscale nu a reușit.'))
    } finally {
      setSyncing(false)
    }
  }

  const reload = () => {
    setLoading(true)
    void fetchConnection()
    if (connection?.connected) void fetchSync()
  }

  const connect = async () => {
    setSaving(true)
    setError('')
    try {
      setConnection(await fiscalLinkService.connect())
    } catch (err) {
      setError(getErrorMessage(err, 'Conectarea FiscalLink nu a reușit.'))
    } finally {
      setSaving(false)
    }
  }

  const copyCode = async () => {
    if (!connection?.activationCode) return
    try {
      await navigator.clipboard.writeText(connection.activationCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fără acces la clipboard, codul rămâne vizibil și selectabil.
    }
  }

  const connected = connection?.connected === true
  const liveError = error || connection?.error

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader title="FiscalLink" />

      <Paper elevation={0} sx={cardSx}>
        <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <Typography sx={{ color: T.ink, fontWeight: 800, flex: 1 }}>Casă de marcat</Typography>
          {!loading && <StatusChip tone={connected ? 'active' : 'neutral'} label={connected ? 'Conectat' : 'Neconectat'} />}
        </Stack>

        {loading && !connection ? (
          <Stack sx={{ alignItems: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: T.primary }} />
          </Stack>
        ) : !connected ? (
          <Button variant="contained" onClick={connect} disabled={saving} sx={{ minWidth: 140 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Conectează'}
          </Button>
        ) : connection?.activationCode ? (
          <Stack spacing={1.5}>
            <Box sx={{ p: 2, borderRadius: `${T.radius.md}px`, border: `1px solid ${T.border}` }}>
              <Typography sx={{ color: T.textSubtle, fontSize: '0.75rem' }}>Cod de activare</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.4 }}>
                <Typography
                  sx={{ color: T.ink, fontWeight: 800, fontFamily: 'monospace', fontSize: { xs: '0.85rem', sm: '1rem' }, overflowWrap: 'anywhere', flex: 1, userSelect: 'all' }}
                >
                  {connection.activationCode}
                </Typography>
                <Tooltip title={copied ? 'Copiat' : 'Copiază'}>
                  <IconButton size="small" onClick={copyCode} aria-label="Copiază codul">
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            {connection.activationLink && (
              <Box>
                <Button
                  variant="contained"
                  href={connection.activationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewRoundedIcon />}
                >
                  Activează în FiscalLink
                </Button>
              </Box>
            )}
          </Stack>
        ) : null}

        {liveError && <Alert severity="error" sx={{ mt: 2 }}>{liveError}</Alert>}
      </Paper>

      {connected && (
        <Paper elevation={0} sx={cardSx}>
          <Stack spacing={2}>
            <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, flex: 1 }}>Bonuri și rapoarte Z</Typography>
              <Button variant="outlined" startIcon={syncing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
                onClick={synchronize} disabled={syncing || !sync?.configured}>
                {syncing ? 'Se sincronizează…' : 'Sincronizează acum'}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Documentele emise cu succes prin FiscalLink Cloud se importă automat zilnic. Fiecare raport Z
              înregistrează o singură încasare cash în contabilitate; bonurile îi verifică totalul.
              Plățile cu cardul încasate prin Bolt sau Uber se verifică separat cu banca și rapoartele platformelor.
            </Typography>
            {sync && !sync.configured && <Alert severity="info">
              Importul automat nu este activat încă. Echipa RIDElance trebuie să configureze conexiunea contabilă FiscalLink.
            </Alert>}
            {sync?.configured && <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Typography variant="body2"><strong>{sync.receipts}</strong> bonuri importate</Typography>
              <Typography variant="body2"><strong>{sync.zReports}</strong> rapoarte Z</Typography>
              <Typography variant="body2" color="text.secondary">
                {sync.lastSyncAtUtc ? `Ultima sincronizare: ${new Date(sync.lastSyncAtUtc).toLocaleString('ro-RO')}` : 'Așteaptă prima sincronizare.'}
              </Typography>
            </Stack>}
            {(syncError || sync?.error) && <Alert severity="warning">{syncError || sync?.error}</Alert>}
            <Typography variant="caption" color="text.secondary">
              Sincronizarea citește documentele existente. Nu emite bonuri și nu închide ziua fiscală.
            </Typography>
          </Stack>
        </Paper>
      )}

      {connected && (
        <Paper elevation={0} sx={cardSx}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ color: T.ink, fontWeight: 800, flex: 1 }}>Case de marcat</Typography>
            <Tooltip title="Reîncarcă">
              <span>
                <IconButton size="small" onClick={reload} disabled={loading} aria-label="Reîncarcă">
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {connection.registers.length === 0 ? (
            <Typography sx={{ color: T.textMuted, fontSize: '0.88rem' }}>Nicio casă de marcat activată.</Typography>
          ) : (
            <Stack spacing={1}>
              {connection.registers.map((register) => {
                const state = registerState(register)
                return (
                  <Stack
                    key={register.id}
                    direction="row"
                    useFlexGap
                    spacing={1.5}
                    sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1, p: 1.5, borderRadius: `${T.radius.md}px`, border: `1px solid ${T.border}` }}
                  >
                    <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', flexGrow: 1 }}>
                      {register.serialNumber ?? '—'}
                    </Typography>
                    <StatusChip tone={state.tone} label={state.label} size="sm" />
                  </Stack>
                )
              })}
            </Stack>
          )}
        </Paper>
      )}
    </Stack>
  )
}
