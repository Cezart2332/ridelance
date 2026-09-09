import { useCallback, useEffect, useMemo, useState } from 'react'

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
  Pagination,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'

import { BankConnectPanel } from '../../banking/BankConnectPanel'
import { DASHBOARD_TOKENS as T, responsiveTableContainerSx } from '../dashboardTheme'
import { PageHeader } from '../ui'
import {
  bankService,
  type BankConnectionDto,
  type BankTransactionsDto,
} from '../../../services/bank.service'

const PAGE_SIZE = 25

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: `${T.radius.lg}px`,
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow.sm,
  backgroundColor: T.paper,
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency || 'RON',
    maximumFractionDigits: 2,
  }).format(amount)

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

const monthOptions = () => {
  const options: { label: string; year: number; month: number }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      label: d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    })
  }
  return options
}

interface BankTabProps {
  onNavigate?: (section: string) => void
}

export function BankTab({ onNavigate }: BankTabProps) {

  const [loading, setLoading] = useState(true)
  const [connection, setConnection] = useState<BankConnectionDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  // Transactions
  const [transactions, setTransactions] = useState<BankTransactionsDto | null>(null)
  const [txLoading, setTxLoading] = useState(false)
  const months = useMemo(monthOptions, [])
  const [monthIndex, setMonthIndex] = useState(0)
  const [page, setPage] = useState(1)

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

  useEffect(() => {
    if (!isLinked) return
    setTxLoading(true)
    const m = months[monthIndex]
    bankService
      .getTransactions({ year: m?.year, month: m?.month, page, pageSize: PAGE_SIZE })
      .then(setTransactions)
      .catch(() => setTransactions(null))
      .finally(() => setTxLoading(false))
  }, [isLinked, monthIndex, page, months])

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

          <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
            {/* Toolbar tranzacții */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                p: { xs: 2, md: 2.5 },
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ReceiptLongRoundedIcon sx={{ fontSize: 20, color: T.primaryStrong }} />
                <Typography sx={{ fontWeight: 800, color: T.ink, fontSize: 15.5 }}>
                  Tranzacții
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                {transactions && (
                  <>
                    <Chip
                      size="small"
                      label={`Încasări: ${formatMoney(transactions.totalIn, 'RON')}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: T.accent,
                        backgroundColor: alpha(T.accent, 0.1),
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Cheltuieli: ${formatMoney(transactions.totalOut, 'RON')}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: T.textMuted,
                        backgroundColor: alpha(T.ink, 0.06),
                      }}
                    />
                  </>
                )}
                <TextField
                  select
                  size="small"
                  value={monthIndex}
                  onChange={(e) => {
                    setMonthIndex(Number(e.target.value))
                    setPage(1)
                  }}
                  slotProps={{ select: { native: true } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: `${T.radius.full}px`,
                      backgroundColor: T.surface,
                      fontSize: 13.5,
                      fontWeight: 600,
                    },
                  }}
                >
                  {months.map((m, idx) => (
                    <option key={m.label} value={idx}>
                      {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                    </option>
                  ))}
                </TextField>
              </Stack>
            </Stack>

            {/* Listă tranzacții */}
            {txLoading ? (
              <Stack sx={{ alignItems: 'center', py: 6 }}>
                <CircularProgress size={28} sx={{ color: T.primary }} />
              </Stack>
            ) : !transactions || transactions.items.length === 0 ? (
              <Stack spacing={1} sx={{ alignItems: 'center', py: 6, px: 2, textAlign: 'center' }}>
                <ReceiptLongRoundedIcon sx={{ fontSize: 36, color: T.textSubtle }} />
                <Typography sx={{ color: T.textMuted, fontSize: 14 }}>
                  Nicio tranzacție în luna selectată.
                </Typography>
                <Typography sx={{ color: T.textSubtle, fontSize: 12.5 }}>
                  Prima sincronizare poate dura câteva minute după conectare.
                </Typography>
              </Stack>
            ) : (
              <Box sx={responsiveTableContainerSx}>
                <Box sx={{ minWidth: { xs: 0, sm: 560 } }}>
                  {transactions.items.map((tx) => {
                    const isCredit = tx.amount >= 0
                    return (
                      <Stack
                        key={tx.id}
                        direction="row"
                        spacing={1.5}
                        sx={{
                          alignItems: 'center',
                          px: { xs: 2, md: 2.5 },
                          py: 1.5,
                          borderBottom: `1px solid ${T.border}`,
                          '&:last-of-type': { borderBottom: 'none' },
                        }}
                      >
                        <Typography
                          sx={{
                            width: { xs: 70, sm: 84 },
                            flexShrink: 0,
                            fontSize: { xs: 12, sm: 13 },
                            color: T.textMuted,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatDate(tx.bookingDate)}
                        </Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 650,
                              fontSize: 14,
                              color: T.ink,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx.counterpartyName || tx.remittanceInfo || 'Tranzacție'}
                          </Typography>
                          {tx.counterpartyName && tx.remittanceInfo && (
                            <Typography
                              sx={{
                                fontSize: 12.5,
                                color: T.textSubtle,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {tx.remittanceInfo}
                            </Typography>
                          )}
                        </Box>
                        {tx.isPending && (
                          <Chip
                            size="small"
                            label="În procesare"
                            sx={{
                              height: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              color: T.textMuted,
                              backgroundColor: alpha(T.ink, 0.06),
                              flexShrink: 0,
                              display: { xs: 'none', sm: 'inline-flex' },
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            flexShrink: 0,
                            fontWeight: 750,
                            fontSize: 14,
                            fontVariantNumeric: 'tabular-nums',
                            // Semnul distinge intrarea de ieșire; culoarea rămâne în paletă.
                            color: isCredit ? T.accent : T.ink,
                          }}
                        >
                          {isCredit ? '+' : ''}
                          {formatMoney(tx.amount, tx.currency)}
                        </Typography>
                      </Stack>
                    )
                  })}
                </Box>
              </Box>
            )}

            {transactions && transactions.totalCount > PAGE_SIZE && (
              <Stack sx={{ alignItems: 'center', py: 2, borderTop: `1px solid ${T.border}` }}>
                <Pagination
                  count={Math.ceil(transactions.totalCount / PAGE_SIZE)}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  size="small"
                />
              </Stack>
            )}
          </Paper>
        </>
      )}

      {/* Dialog deconectare */}
      <Dialog open={confirmDisconnect} onClose={() => setConfirmDisconnect(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Deconectezi banca?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.textMuted, fontSize: 14 }}>
            Sincronizarea automată a tranzacțiilor se oprește, iar extrasul de cont va trebui
            încărcat din nou manual. Tranzacțiile deja sincronizate rămân vizibile.
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
