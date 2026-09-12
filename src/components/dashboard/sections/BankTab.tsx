import { useCallback, useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'

import { BankActivityPanel } from '../../banking/BankActivityPanel'
import { BankConnectPanel } from '../../banking/BankConnectPanel'
import { DASHBOARD_TOKENS as T } from '../dashboardTheme'
import { PageHeader } from '../ui'
import { bankService, type BankConnectionDto } from '../../../services/bank.service'

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: `${T.radius.lg}px`,
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow.sm,
  backgroundColor: T.paper,
}

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

interface BankTabProps {
  onNavigate?: (section: string) => void
}

export function BankTab({ onNavigate }: BankTabProps) {

  const [loading, setLoading] = useState(true)
  const [connection, setConnection] = useState<BankConnectionDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const loadConnection = useCallback(async () => {
    try {
      const data = await bankService.getConnection()
      setConnection(data)
      setError(null)
      return data
    } catch {
      setError('Nu s-a putut încărca starea conexiunii bancare.')
      return null
    }
  }, [])

  // Providerul nu ne întoarce nimic după conectare: linkul se termină la el. Deci starea o
  // aflăm întrebând, iar întrebarea e chiar cea care declanșează revendicarea pe server.
  useEffect(() => {
    let cancelled = false

    bankService
      .getConnection()
      .then((data) => {
        if (cancelled) return
        setConnection(data)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu s-a putut încărca starea conexiunii bancare.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const isLinked = connection?.status === 'Linked'

  const handleDisconnect = async () => {
    setConfirmDisconnect(false)
    try {
      await bankService.disconnect()
      setSnackbar('Banca a fost deconectată.')
      await loadConnection()
    } catch {
      setSnackbar('Deconectarea nu a reușit. Încearcă din nou.')
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: T.primary }} />
        <Typography sx={{ color: T.textMuted, fontSize: 14 }}>
          Se încarcă…
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Banca"
        subtitle="Conectează-ți contul bancar prin open banking (PSD2) și tranzacțiile ajung automat în platformă — fără extrase de cont încărcate manual."
      />

      {error && <Alert severity="error">{error}</Alert>}

      {/*
        Reconectarea, când acordul a expirat sau sincronizarea a eșuat. Băncile cer reautorizare
        la câteva luni, deci ăsta nu e un caz de excepție, ci ceva ce fiecare utilizator va vedea.
      */}
      {connection && (connection.status === 'Expired' || connection.status === 'Error') && (
        <Alert severity="warning" icon={<ErrorOutlineRoundedIcon />}>
          {connection.status === 'Expired'
            ? `Acordul pentru ${connection.institutionName} a expirat. Din motive de securitate,
               băncile cer reautorizarea la câteva luni — alege banca mai jos ca să reiei sincronizarea.`
            : connection.errorMessage ?? 'Sincronizarea nu a mai reușit. Reconectează contul.'}
        </Alert>
      )}

      {!isLinked && (
        <>
          <BankConnectPanel
            connection={connection}
            onRefresh={loadConnection}
            onNotify={setSnackbar}
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 0.5 }}>
            <UploadFileRoundedIcon sx={{ fontSize: 18, color: T.textSubtle }} />
            <Typography sx={{ fontSize: 13, color: T.textMuted }}>
              Preferi varianta manuală?{' '}
              <Box
                component="span"
                onClick={() => onNavigate?.('documents')}
                sx={{
                  color: T.primaryStrong,
                  fontWeight: 700,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Încarcă extrasul de cont din Documente
              </Box>
            </Typography>
          </Stack>
        </>
      )}

      {/* Conectat: card conexiune + tranzacții */}
      {isLinked && connection && (
        <>
          <Paper elevation={0} sx={cardSx}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                {connection.institutionLogo ? (
                  <Box
                    component="img"
                    src={connection.institutionLogo}
                    alt=""
                    sx={{ width: 44, height: 44, borderRadius: `${T.radius.md}px`, objectFit: 'contain' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: `${T.radius.md}px`,
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: alpha(T.primary, 0.12),
                      color: T.primaryStrong,
                    }}
                  >
                    <AccountBalanceRoundedIcon />
                  </Box>
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 800, color: T.ink, fontSize: 16 }}>
                      {connection.institutionName}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<VerifiedUserRoundedIcon sx={{ fontSize: 14 }} />}
                      label="Conectat"
                      sx={{
                        height: 22,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: T.stateActive,
                        backgroundColor: alpha(T.stateActive, 0.1),
                        '& .MuiChip-icon': { color: T.stateActive },
                      }}
                    />
                  </Stack>
                  <Typography sx={{ fontSize: 12.5, color: T.textMuted }}>
                    {connection.accounts
                      .map((a) => a.ibanMasked ?? 'Cont bancar')
                      .join(' · ') || 'Cont bancar'}
                    {' · '}Consimțământ valabil până la {formatDate(connection.consentExpiresAtUtc)}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: T.textSubtle }}>
                    Ultima sincronizare: {connection.lastSyncedAtUtc
                      ? new Date(connection.lastSyncedAtUtc).toLocaleString('ro-RO')
                      : 'în curs…'}
                    {' '}· Tranzacțiile se actualizează automat de ~2 ori pe zi.
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Tooltip title="Deconectează banca">
                  <IconButton
                    onClick={() => setConfirmDisconnect(true)}
                    sx={{
                      border: `1px solid ${T.border}`,
                      borderRadius: `${T.radius.md}px`,
                      color: T.textMuted,
                      '&:hover': { color: T.stateError, borderColor: alpha(T.stateError, 0.3) },
                    }}
                  >
                    <LinkOffRoundedIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>

          <BankActivityPanel />
        </>
      )}

      {/* Dialog deconectare */}
      <Dialog open={confirmDisconnect} onClose={() => setConfirmDisconnect(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Deconectezi banca?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.textMuted, fontSize: 14 }}>
            Sincronizarea automată se oprește, iar contabilul nu mai vede mișcările noi din cont.
            Tranzacțiile deja sincronizate rămân vizibile.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDisconnect(false)}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Anulează
          </Button>
          <Button
            variant="contained"
            disableElevation
            color="error"
            onClick={handleDisconnect}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${T.radius.full}px` }}
          >
            Deconectează
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Stack>
  )
}
