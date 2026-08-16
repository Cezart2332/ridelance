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
import { PageHeader } from '../ui'
import {
  bankService,
  type BankConnectionDto,
  type BankInstitutionDto,
  type BankTransactionsDto,
} from '../../../services/bank.service'

const PAGE_SIZE = 25

/** Cât de des reîntrebăm serverul cât timp așteptăm confirmarea conectării. */
const POLL_INTERVAL_MS = 4000

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
  const [choosingId, setChoosingId] = useState<string | null>(null)
  /** Setat doar când fila nu s-a putut deschide — atunci linkul se oferă ca buton. */
  const [pendingLink, setPendingLink] = useState<string | null>(null)

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

  const isWaiting =
    connection?.status === 'Created' ||
    (connection?.status === 'Pending' && (connection.candidates?.length ?? 0) === 0)

  const linkExpired =
    connection?.linkExpiresAtUtc != null && new Date(connection.linkExpiresAtUtc) <= new Date()

  // Cât timp așteptăm confirmarea, reîntrebăm periodic. Ne oprim la expirarea linkului:
  // după el, o conexiune nouă aparține altcuiva, nu celui care aștepta.
  useEffect(() => {
    if (!isWaiting || linkExpired) return undefined

    const timer = window.setInterval(() => {
      void loadConnection()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [isWaiting, linkExpired, loadConnection])

  const needsPicker =
    !loading &&
    !isWaiting &&
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

    // Fila se deschide *sincron*, în gestul de click, și abia apoi primește adresa. Dacă am
    // aștepta întâi răspunsul serverului, browserul ar considera `window.open` un popup
    // nesolicitat și l-ar bloca — utilizatorul ar rămâne cu „termină conectarea în fila care
    // s-a deschis" fără să se fi deschis vreo filă.
    //
    // Fără `noopener`: cu el, `window.open` întoarce prin specificație `null`, deci n-am mai
    // putea seta adresa filei. Legătura spre noi se rupe imediat după, prin `opener = null`.
    const tab = window.open('', '_blank')

    try {
      const { link } = await bankService.initiateConnection(institutionId)

      if (tab && !tab.closed) {
        tab.opener = null
        tab.location.href = link
        setPendingLink(null)
      } else {
        // Popup blocat sau filă închisă între timp: nu pretindem că s-a deschis ceva, ci
        // oferim linkul ca acțiune explicită.
        setPendingLink(link)
      }

      await loadConnection()
    } catch (err) {
      tab?.close()
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setSnackbar(detail ?? 'Conectarea nu a putut fi inițiată. Încearcă din nou.')
    } finally {
      setConnectingId(null)
    }
  }

  const handleChoose = async (providerConnectionId: string) => {
    setChoosingId(providerConnectionId)
    try {
      const data = await bankService.chooseConnection(providerConnectionId)
      setConnection(data)
      setSnackbar('Banca a fost conectată cu succes!')
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setSnackbar(detail ?? 'Conexiunea aleasă nu a putut fi revendicată.')
      await loadConnection()
    } finally {
      setChoosingId(null)
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

      {/* Stare: în așteptarea autorizării */}
      {/* Așteptăm confirmarea: linkul s-a deschis în alt tab și e încă valabil. */}
      {connection && isWaiting && !linkExpired && !showPicker && (
        <Paper elevation={0} sx={cardSx}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <CircularProgress size={28} sx={{ color: T.primary, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: T.ink }}>
                {pendingLink ? 'Deschide pagina băncii' : 'Se așteaptă confirmarea de la bancă'}
              </Typography>
              <Typography sx={{ color: T.textMuted, fontSize: 13.5 }}>
                {pendingLink
                  ? 'Browserul a blocat deschiderea automată a filei. Apasă butonul ca să continui conectarea.'
                  : 'Termină conectarea în fila care s-a deschis. Pagina se actualizează singură când banca răspunde — nu e nevoie să faci nimic aici.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {pendingLink && (
                <Button
                  variant="contained"
                  disableElevation
                  component="a"
                  href={pendingLink}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    borderRadius: `${T.radius.full}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    backgroundColor: T.primary,
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: T.primaryStrong },
                  }}
                >
                  Continuă la bancă
                </Button>
              )}
              <Button
                variant="text"
                onClick={() => {
                  setPendingLink(null)
                  setShowPicker(true)
                }}
                sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
              >
                Începe din nou
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Linkul a expirat fără să apară vreo conexiune. */}
      {connection && isWaiting && linkExpired && !showPicker && (
        <Paper elevation={0} sx={cardSx}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: `${T.radius.md}px`,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: alpha(T.ink, 0.06),
                color: T.textMuted,
                flexShrink: 0,
              }}
            >
              <SyncRoundedIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: T.ink }}>
                Linkul de conectare a expirat
              </Typography>
              <Typography sx={{ color: T.textMuted, fontSize: 13.5 }}>
                Linkurile sunt de unică folosință și au viață scurtă. Pornește o conectare nouă.
              </Typography>
            </Box>
            <Button
              variant="contained"
              disableElevation
              startIcon={<ReplayRoundedIcon />}
              onClick={() => setShowPicker(true)}
              sx={{
                borderRadius: `${T.radius.full}px`,
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: T.primary,
                '&:hover': { backgroundColor: T.primaryStrong },
              }}
            >
              Reia conectarea
            </Button>
          </Stack>
        </Paper>
      )}

      {/*
        Cazul ambiguu. Contul de provider e comun tuturor clienților, iar linkul nu poate purta
        o referință de-a noastră — deci când apar mai multe conexiuni noi deodată, singurul mod
        onest de a afla care e a ta e să te întrebăm. Nu ghicim: o ghiceală greșită ar arăta
        extrasul altcuiva.
      */}
      {connection && (connection.candidates?.length ?? 0) > 0 && !showPicker && (
        <Paper elevation={0} sx={cardSx}>
          <Typography sx={{ fontWeight: 700, color: T.ink }}>
            Care dintre conexiuni este a ta?
          </Typography>
          <Typography sx={{ color: T.textMuted, fontSize: 13.5, mb: 2 }}>
            S-au finalizat mai multe conectări în același timp. Alege banca pe care tocmai ai
            conectat-o.
          </Typography>

          <Stack spacing={1}>
            {(connection.candidates ?? []).map((candidate) => (
              <Paper
                key={candidate.providerConnectionId}
                elevation={0}
                component="button"
                onClick={() => handleChoose(candidate.providerConnectionId)}
                disabled={choosingId !== null}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  width: '100%',
                  p: 1.5,
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: `1px solid ${T.border}`,
                  borderRadius: `${T.radius.md}px`,
                  backgroundColor: T.paper,
                  font: 'inherit',
                  '&:hover': { borderColor: T.primary },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: T.ink, fontSize: 14 }}>
                    {candidate.institutionName ?? 'Bancă necunoscută'}
                  </Typography>
                  {candidate.createdAtUtc && (
                    <Typography sx={{ color: T.textMuted, fontSize: 12.5 }}>
                      Conectată la {formatDate(candidate.createdAtUtc)}
                    </Typography>
                  )}
                </Box>
                {choosingId === candidate.providerConnectionId && <CircularProgress size={18} />}
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Stare: expirat / eroare */}
      {connection && (connection.status === 'Expired' || connection.status === 'Error') && !showPicker && (
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            border: `1px solid ${alpha(T.stateError, 0.25)}`,
            backgroundColor: alpha(T.stateError, 0.03),
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
                backgroundColor: alpha(T.stateError, 0.08),
                color: T.stateError,
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
                          Conectare securizată prin Fintable
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
