import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

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
  InputAdornment,
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
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'

import { DASHBOARD_TOKENS as T, responsiveTableContainerSx } from '../dashboardTheme'
import {
  bankService,
  type BankConnectionDto,
  type BankInstitutionDto,
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
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [connection, setConnection] = useState<BankConnectionDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  // Institution picker
  const [institutions, setInstitutions] = useState<BankInstitutionDto[] | null>(null)
  const [institutionsError, setInstitutionsError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

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

  // Callback de la bancă: GoCardless întoarce ?ref=..., Enable Banking ?state=...&code=...
  // (sau ?state=...&error=... când userul anulează autorizarea).
  useEffect(() => {
    const reference = searchParams.get('ref') ?? searchParams.get('state')
    const code = searchParams.get('code')
    const authError = searchParams.get('error')
    const authErrorDescription = searchParams.get('error_description')

    const stripCallbackParams = () => {
      const next = new URLSearchParams(searchParams)
      for (const param of ['ref', 'state', 'code', 'error', 'error_description']) {
        next.delete(param)
      }
      setSearchParams(next, { replace: true })
    }

    const boot = async () => {
      if (reference && !authError) {
        setFinalizing(true)
        try {
          const data = await bankService.finalizeConnection(reference, code)
          setConnection(data)
          if (data.status === 'Linked') setSnackbar('Banca a fost conectată cu succes!')
        } catch {
          await loadConnection()
        } finally {
          stripCallbackParams()
          setFinalizing(false)
          setLoading(false)
        }
        return
      }

      if (authError) {
        stripCallbackParams()
        const detail = authErrorDescription ? `${authError}: ${authErrorDescription}` : authError
        setSnackbar(`Conectarea băncii a eșuat la autorizare (${detail}). Poți încerca din nou.`)
      }

      await loadConnection()
      setLoading(false)
    }

    void boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const needsPicker =
    !loading &&
    !finalizing &&
    (showPicker || !connection || connection.status === 'Revoked')

  useEffect(() => {
    if (!needsPicker || institutions !== null) return
    bankService
      .getInstitutions()
      .then((list) => {
        setInstitutions(list)
        setInstitutionsError(null)
      })
      .catch((err: { response?: { data?: { detail?: string } } }) => {
        setInstitutionsError(
          err.response?.data?.detail ??
            'Conectarea băncii nu este disponibilă momentan. Poți încărca extrasul de cont manual, din Documente.',
        )
      })
  }, [needsPicker, institutions])

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

  const handleConnect = async (institutionId: string) => {
    setConnectingId(institutionId)
    try {
      const { link } = await bankService.initiateConnection(institutionId)
      window.location.href = link
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setSnackbar(detail ?? 'Conectarea nu a putut fi inițiată. Încearcă din nou.')
      setConnectingId(null)
    }
  }

  const handleDisconnect = async () => {
    setConfirmDisconnect(false)
    try {
      await bankService.disconnect()
      setSnackbar('Banca a fost deconectată.')
      setInstitutions(null)
      setShowPicker(false)
      await loadConnection()
    } catch {
      setSnackbar('Deconectarea nu a reușit. Încearcă din nou.')
    }
  }

  const filteredInstitutions = useMemo(
    () =>
      (institutions ?? []).filter((i) =>
        i.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [institutions, search],
  )

  // ── Loading / finalizing ─────────────────────────────────────────────────
  if (loading || finalizing) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: T.primary }} />
        <Typography sx={{ color: T.textMuted, fontSize: 14 }}>
          {finalizing ? 'Se conectează banca…' : 'Se încarcă…'}
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box>
        <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, color: T.ink }}>
          Banca
        </Typography>
        <Typography sx={{ color: T.textMuted, fontSize: 14, mt: 0.5 }}>
          Conectează-ți contul bancar prin open banking (PSD2) și tranzacțiile ajung automat în
          platformă — fără extrase de cont încărcate manual.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Stare: în așteptarea autorizării */}
      {connection && (connection.status === 'Created' || connection.status === 'Pending') && !showPicker && (
        <Paper elevation={0} sx={cardSx}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: `${T.radius.md}px`,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: alpha('#b45309', 0.08),
                color: '#b45309',
                flexShrink: 0,
              }}
            >
              <SyncRoundedIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: T.ink }}>
                Autorizarea la {connection.institutionName} nu a fost finalizată
              </Typography>
              <Typography sx={{ color: T.textMuted, fontSize: 13.5 }}>
                Reia procesul de conectare sau alege altă bancă.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disableElevation
                startIcon={connectingId ? undefined : <ReplayRoundedIcon />}
                disabled={connectingId !== null}
                onClick={() => handleConnect(connection.institutionId)}
                sx={{
                  borderRadius: `${T.radius.full}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  backgroundColor: T.primary,
                  '&:hover': { backgroundColor: T.primaryStrong },
                }}
              >
                {connectingId ? 'Se deschide banca…' : 'Reia conectarea'}
              </Button>
              <Button
                variant="text"
                onClick={() => setShowPicker(true)}
                sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
              >
                Altă bancă
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Stare: expirat / eroare */}
      {connection && (connection.status === 'Expired' || connection.status === 'Error') && !showPicker && (
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            border: `1px solid ${alpha('#dc2626', 0.25)}`,
            backgroundColor: alpha('#dc2626', 0.03),
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: `${T.radius.md}px`,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: alpha('#dc2626', 0.08),
                color: '#dc2626',
                flexShrink: 0,
              }}
            >
              <ErrorOutlineRoundedIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: T.ink }}>
                {connection.status === 'Expired'
                  ? `Consimțământul pentru ${connection.institutionName} a expirat`
                  : `Problemă la sincronizarea cu ${connection.institutionName}`}
              </Typography>
              <Typography sx={{ color: T.textMuted, fontSize: 13.5 }}>
                {connection.status === 'Expired'
                  ? 'Din motive de securitate, băncile cer re-autorizarea accesului la ~90 de zile. Reconectează contul pentru a relua sincronizarea.'
                  : connection.errorMessage ?? 'Reconectează contul pentru a relua sincronizarea.'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              disableElevation
              startIcon={connectingId ? undefined : <ReplayRoundedIcon />}
              disabled={connectingId !== null}
              onClick={() => handleConnect(connection.institutionId)}
              sx={{
                borderRadius: `${T.radius.full}px`,
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: T.primary,
                '&:hover': { backgroundColor: T.primaryStrong },
                flexShrink: 0,
              }}
            >
              {connectingId ? 'Se deschide banca…' : 'Reconectează'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Picker de bănci */}
      {needsPicker && (
        <Paper elevation={0} sx={cardSx}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
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
              <Box>
                <Typography sx={{ fontWeight: 800, color: T.ink, fontSize: 17 }}>
                  Alege banca ta
                </Typography>
                <Typography sx={{ color: T.textMuted, fontSize: 13.5 }}>
                  Vei fi redirecționat pe pagina securizată a băncii pentru autorizare. RIDElance nu
                  vede și nu stochează parola ta de bancă.
                </Typography>
              </Box>
            </Stack>

            {institutionsError ? (
              <Alert severity="info">{institutionsError}</Alert>
            ) : institutions === null ? (
              <Stack sx={{ alignItems: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: T.primary }} />
              </Stack>
            ) : (
              <>
                <TextField
                  size="small"
                  placeholder="Caută banca…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon sx={{ fontSize: 20, color: T.textSubtle }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    maxWidth: 360,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: `${T.radius.full}px`,
                      backgroundColor: T.surface,
                    },
                  }}
                />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                    },
                    gap: 1.5,
                  }}
                >
                  {filteredInstitutions.map((inst) => (
                    <Paper
                      key={inst.id}
                      elevation={0}
                      component="button"
                      type="button"
                      disabled={connectingId !== null}
                      onClick={() => handleConnect(inst.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.75,
                        borderRadius: `${T.radius.md}px`,
                        border: `1px solid ${T.border}`,
                        backgroundColor: T.paper,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all .15s ease',
                        opacity: connectingId !== null && connectingId !== inst.id ? 0.5 : 1,
                        '&:hover': {
                          borderColor: T.primary,
                          boxShadow: T.shadow.glow,
                        },
                      }}
                    >
                      {inst.logo ? (
                        <Box
                          component="img"
                          src={inst.logo}
                          alt=""
                          sx={{ width: 34, height: 34, borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            display: 'grid',
                            placeItems: 'center',
                            backgroundColor: T.surfaceAlt,
                            color: T.textMuted,
                            flexShrink: 0,
                          }}
                        >
                          <AccountBalanceRoundedIcon sx={{ fontSize: 20 }} />
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: T.ink,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {connectingId === inst.id ? 'Se deschide banca…' : inst.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: T.textSubtle }}>
                          Istoric până la {inst.maxHistoricalDays} zile
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                  {filteredInstitutions.length === 0 && (
                    <Typography sx={{ color: T.textMuted, fontSize: 14, py: 2 }}>
                      Nicio bancă găsită pentru „{search}".
                    </Typography>
                  )}
                </Box>
              </>
            )}

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pt: 0.5 }}>
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
          </Stack>
        </Paper>
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
                        color: '#059669',
                        backgroundColor: alpha('#059669', 0.1),
                        '& .MuiChip-icon': { color: '#059669' },
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
                      '&:hover': { color: '#dc2626', borderColor: alpha('#dc2626', 0.3) },
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
                        color: '#059669',
                        backgroundColor: alpha('#059669', 0.08),
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Cheltuieli: ${formatMoney(transactions.totalOut, 'RON')}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: '#dc2626',
                        backgroundColor: alpha('#dc2626', 0.07),
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
                              color: '#b45309',
                              backgroundColor: alpha('#b45309', 0.08),
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
                            color: isCredit ? '#059669' : '#dc2626',
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
