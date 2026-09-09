import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { DASHBOARD_TOKENS as T } from '../dashboard/dashboardTheme'
import {
  bankService,
  type BankConnectionDto,
  type BankInstitutionDto,
} from '../../services/bank.service'

/** Cât de des reîntrebăm serverul cât timp așteptăm confirmarea de la bancă. */
const POLL_INTERVAL_MS = 4000

/** Termenii serviciului de open banking, pe care furnizorul cere să-i accepte utilizatorul. */
const TERMS_URL = 'https://www.smartfintech.eu/terms-and-conditions-smartaccounts'

/**
 * Conectarea unui cont bancar prin open banking, într-un singur loc.
 *
 * Trăiește separat de ecranele care îl folosesc fiindcă sunt patru: fila „Banca" din ambele
 * dashboarduri, pasul de bancă din înrolarea SRL, ecranul de bancă din înrolarea PFA și pagina de
 * conexiuni a firmei. Înainte, fiecare avea propria variantă — cel din înrolarea SRL conecta
 * „orb", fără să te lase să alegi banca, iar cel din pagina de conexiuni nu conecta deloc.
 *
 * Ce nu se vede la prima citire: unele bănci cer date suplimentare *înainte* de consimțământ
 * (numele de utilizator de la bancă, PF sau PJ, codul de client firmă). Care anume ne spune tot
 * furnizorul, per bancă, deci ecranul de date suplimentare apare exact când trebuie și numai cu
 * câmpurile cerute.
 */
export interface BankConnectPanelProps {
  /** Conexiunea curentă, așa cum o știe părintele. Null înseamnă „încă niciuna". */
  connection: BankConnectionDto | null
  /** Reîncarcă starea din server. Panoul o cheamă la fiecare pas care poate schimba ceva. */
  onRefresh: () => Promise<BankConnectionDto | null> | Promise<void> | void
  /** Mesaje pentru bara de notificări a părintelui, dacă are una. */
  onNotify?: (message: string) => void
  /** Fără antet propriu — pentru ecranele care au deja titlul lor. */
  hideHeader?: boolean
}

interface ExtraFields {
  psuId: string
  psuIdType: string
  psuCorporateId: string
  iban: string
}

const EMPTY_EXTRA: ExtraFields = { psuId: '', psuIdType: '', psuCorporateId: '', iban: '' }

export function BankConnectPanel({
  connection,
  onRefresh,
  onNotify,
  hideHeader = false,
}: BankConnectPanelProps) {
  const [institutions, setInstitutions] = useState<BankInstitutionDto[] | null>(null)
  const [institutionsError, setInstitutionsError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<BankInstitutionDto | null>(null)
  const [extra, setExtra] = useState<ExtraFields>(EMPTY_EXTRA)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Setat doar când fila nu s-a putut deschide — atunci adresa se oferă ca buton. */
  const [pendingLink, setPendingLink] = useState<string | null>(null)
  /** „Începe din nou": readuce selectorul peste o conectare în așteptare. */
  const [restarted, setRestarted] = useState(false)

  const waiting = connection?.status === 'Created' || connection?.status === 'Pending'
  const linkExpired =
    connection?.linkExpiresAtUtc != null && new Date(connection.linkExpiresAtUtc) <= new Date()
  const showPicker = restarted || !waiting || linkExpired

  useEffect(() => {
    if (!showPicker || institutions !== null) return

    let cancelled = false

    bankService
      .getInstitutions()
      .then((list) => {
        if (cancelled) return
        setInstitutions(list)
        setInstitutionsError(null)
      })
      .catch((err: { response?: { data?: { detail?: string } } }) => {
        if (cancelled) return
        setInstitutionsError(
          err.response?.data?.detail ??
            'Conectarea băncii nu este disponibilă momentan. Poți încărca extrasul de cont manual, din Documente.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [showPicker, institutions])

  // Cât timp așteptăm autorizarea, reîntrebăm periodic: furnizorul nu ne sună înapoi, iar
  // întrebarea e chiar cea care finalizează conexiunea pe server.
  useEffect(() => {
    if (!waiting || linkExpired || restarted) return undefined

    const timer = window.setInterval(() => {
      void onRefresh()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [waiting, linkExpired, restarted, onRefresh])

  const filtered = useMemo(
    () =>
      (institutions ?? []).filter((i) =>
        i.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [institutions, search],
  )

  const needsExtra = (bank: BankInstitutionDto) =>
    bank.requiresPsuId || bank.requiresPsuIdType || bank.requiresIban

  const missingField = selected
    ? (selected.requiresPsuId && !extra.psuId.trim()) ||
      (selected.requiresPsuIdType && !extra.psuIdType) ||
      (selected.requiresIban && !extra.iban.trim())
    : false

  const connect = useCallback(
    async (bank: BankInstitutionDto, fields: ExtraFields) => {
      setConnecting(true)
      setError(null)

      // Fila se deschide *sincron*, în gestul de click, și abia apoi primește adresa. Dacă am
      // aștepta întâi răspunsul serverului, browserul ar considera `window.open` un popup
      // nesolicitat și l-ar bloca — utilizatorul ar rămâne cu „termină conectarea în fila care
      // s-a deschis" fără să se fi deschis vreo filă.
      //
      // Fără `noopener`: cu el, `window.open` întoarce prin specificație `null`, deci n-am mai
      // putea seta adresa filei. Legătura spre noi se rupe imediat după, prin `opener = null`.
      const tab = window.open('', '_blank')

      try {
        const { link } = await bankService.initiateConnection({
          bankCode: bank.id,
          psuId: fields.psuId.trim() || null,
          psuIdType: fields.psuIdType || null,
          psuCorporateId: fields.psuCorporateId.trim() || null,
          iban: fields.iban.trim() || null,
          tcAccepted: true,
        })

        if (tab && !tab.closed) {
          tab.opener = null
          tab.location.href = link
          setPendingLink(null)
        } else {
          // Popup blocat sau filă închisă între timp: nu pretindem că s-a deschis ceva, ci
          // oferim adresa ca acțiune explicită.
          setPendingLink(link)
        }

        setRestarted(false)
        setSelected(null)
        await onRefresh()
      } catch (err) {
        tab?.close()
        const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        const message = detail ?? 'Conectarea nu a putut fi inițiată. Încearcă din nou.'
        setError(message)
        onNotify?.(message)
      } finally {
        setConnecting(false)
      }
    },
    [onRefresh, onNotify],
  )

  const pick = (bank: BankInstitutionDto) => {
    if (needsExtra(bank)) {
      setSelected(bank)
      setExtra(EMPTY_EXTRA)
      return
    }

    if (!termsAccepted) {
      setError('Bifează acordul cu termenii serviciului înainte de conectare.')
      return
    }

    void connect(bank, EMPTY_EXTRA)
  }

  // ── În așteptarea autorizării ─────────────────────────────────────────────
  if (waiting && !linkExpired && !restarted) {
    return (
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
                : 'Termină autorizarea în fila care s-a deschis. Pagina se actualizează singură când banca răspunde — nu e nevoie să faci nimic aici.'}
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
                sx={primaryButtonSx}
              >
                Continuă la bancă
              </Button>
            )}
            <Button
              variant="text"
              onClick={() => {
                setPendingLink(null)
                setRestarted(true)
              }}
              sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
            >
              Începe din nou
            </Button>
          </Stack>
        </Stack>
      </Paper>
    )
  }

  // ── Datele pe care le cere banca aleasă ───────────────────────────────────
  if (selected) {
    return (
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button
              onClick={() => setSelected(null)}
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted, minWidth: 0 }}
            >
              Înapoi
            </Button>
            <Typography sx={{ fontWeight: 800, color: T.ink, fontSize: 17 }}>
              {selected.name}
            </Typography>
          </Stack>

          <Typography sx={{ color: T.textMuted, fontSize: 13.5 }}>
            Banca asta cere câteva date înainte de a-ți afișa ecranul de autorizare. Le trimitem
            direct ei; nu le păstrăm.
          </Typography>

          {selected.requiresPsuId && (
            <TextField
              size="small"
              label="Utilizatorul tău la bancă"
              helperText="Numele de utilizator cu care intri în aplicația băncii."
              value={extra.psuId}
              onChange={(e) => setExtra((v) => ({ ...v, psuId: e.target.value }))}
              sx={fieldSx}
            />
          )}

          {selected.requiresPsuIdType && (
            <TextField
              size="small"
              select
              label="Tipul contului"
              value={extra.psuIdType}
              onChange={(e) => setExtra((v) => ({ ...v, psuIdType: e.target.value }))}
              sx={fieldSx}
            >
              <MenuItem value="PF">Persoană fizică</MenuItem>
              <MenuItem value="PJ">Firmă</MenuItem>
            </TextField>
          )}

          {extra.psuIdType === 'PJ' && (
            <TextField
              size="small"
              label="Cod client firmă (opțional)"
              helperText="Cerut doar de unele bănci pentru conturile de firmă."
              value={extra.psuCorporateId}
              onChange={(e) => setExtra((v) => ({ ...v, psuCorporateId: e.target.value }))}
              sx={fieldSx}
            />
          )}

          {selected.requiresIban && (
            <TextField
              size="small"
              label="IBAN-ul contului"
              helperText="Banca cere dinainte contul pentru care dai acordul."
              value={extra.iban}
              onChange={(e) => setExtra((v) => ({ ...v, iban: e.target.value }))}
              sx={fieldSx}
            />
          )}

          <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} />

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            variant="contained"
            disableElevation
            disabled={connecting || missingField || !termsAccepted}
            onClick={() => void connect(selected, extra)}
            sx={{ ...primaryButtonSx, alignSelf: 'flex-start' }}
          >
            {connecting ? 'Se deschide banca…' : 'Continuă la bancă'}
          </Button>
        </Stack>
      </Paper>
    )
  }

  // ── Selectorul de bănci ───────────────────────────────────────────────────
  return (
    <Paper elevation={0} sx={cardSx}>
      <Stack spacing={2.5}>
        {!hideHeader && (
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
        )}

        {linkExpired && !restarted && (
          <Alert severity="warning" icon={<ReplayRoundedIcon />}>
            Autorizarea anterioară nu s-a finalizat la timp. Alege banca și reia conectarea.
          </Alert>
        )}

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

            <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} />

            {error && <Alert severity="error">{error}</Alert>}

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
              {filtered.map((inst) => (
                <Paper
                  key={inst.id}
                  elevation={0}
                  component="button"
                  type="button"
                  disabled={connecting}
                  onClick={() => pick(inst)}
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
                    font: 'inherit',
                    '&:hover': { borderColor: T.primary, boxShadow: T.shadow.glow },
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
                  <Typography sx={{ fontWeight: 700, color: T.ink, fontSize: 14, minWidth: 0 }}>
                    {inst.name}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  )
}

/**
 * Acordul cu termenii serviciului de open banking.
 *
 * Nu e o formalitate de-a noastră: furnizorul respinge deschiderea consimțământului dacă nu îi
 * trimitem acordul, deci butonul de conectare chiar depinde de bifă.
 */
function TermsCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} size="small" />}
      label={
        <Typography sx={{ fontSize: 13, color: T.textMuted }}>
          Sunt de acord cu{' '}
          <Box
            component="a"
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: T.primaryStrong, fontWeight: 600 }}
          >
            termenii serviciului de open banking
          </Box>
          , furnizat de Smart Fintech, autorizat de BNR.
        </Typography>
      }
      sx={{ alignItems: 'flex-start', m: 0, '& .MuiCheckbox-root': { pt: 0 } }}
    />
  )
}

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: `${T.radius.lg}px`,
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow.sm,
  backgroundColor: T.paper,
}

const fieldSx = { maxWidth: 420 }

const primaryButtonSx = {
  borderRadius: `${T.radius.full}px`,
  textTransform: 'none',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  backgroundColor: T.primary,
  '&:hover': { backgroundColor: T.primaryStrong },
}

export default BankConnectPanel
