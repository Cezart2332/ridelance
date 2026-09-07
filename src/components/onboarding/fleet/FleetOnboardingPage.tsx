import { useCallback, useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import logo from '../../../assets/logo.svg'
import { useAppSelector } from '../../../store/hooks'
import { SRL_ROOT } from '../../../config/srlNavigation'
import { SRL_PLANS } from '../../../data/plans'
import {
  fleetOnboardingService,
  type FleetInput,
  type FleetState,
} from '../../../services/fleetOnboarding.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { onboardingMuiTheme } from '../onboardingMuiTheme'
import { displaySx, TOKENS } from '../onboardingTheme'
import { FleetContactVerification } from './FleetContactVerification'
import { FleetBankStep, FleetOblioStep } from './FleetConnections'

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE || '')
const steps = [
  'Firma ta',
  'Administrator',
  'Despre flotă',
  'Cont bancar',
  'Oblio',
  'Abonament',
  'Plată',
]
const titles = [
  'Hai să configurăm firma ta',
  'Cine va administra contul RIDElance?',
  'Spune-ne câteva lucruri despre flota ta',
  'Contul bancar al firmei',
  'Conectează programul de facturare',
  'Alege abonamentul potrivit flotei tale',
  'Finalizează configurarea',
]
const positions = [
  'Administrator',
  'Asociat',
  'Manager flotă',
  'Manager operațional',
  'Angajat',
  'Altă funcție',
]
const money = (bani: number) =>
  (bani / 100).toLocaleString('ro-RO', {
    minimumFractionDigits: bani % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })

export default function FleetOnboardingPage() {
  const role = useAppSelector((s) => s.auth.role)
  const [params] = useSearchParams()
  const [state, setState] = useState<FleetState | null>(null)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = useCallback(async () => {
    setState(await fleetOnboardingService.get())
  }, [])
  useEffect(() => {
    let cancelled = false
    fleetOnboardingService
      .get()
      .then((value) => {
        if (cancelled) return
        setState(value)
        setStep(Math.min(value.progress.completedStep + 1, 7))
      })
      .catch((e) => {
        if (!cancelled)
          setError(getErrorMessage(e, 'Nu am putut încărca configurarea.'))
      })
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])
  useEffect(() => {
    if (!params.has('payment') || state?.dashboardAllowed) return
    const timer = window.setInterval(() => {
      void refresh().catch(() =>
        setError('Confirmarea plății întârzie. Poți reîncerca verificarea.'),
      )
    }, 4000)
    return () => window.clearInterval(timer)
  }, [params, state?.dashboardAllowed, refresh])
  const save = async (input: FleetInput) => {
    setBusy(true)
    setError('')
    try {
      const next = await fleetOnboardingService.save(input)
      setState(next)
      if (input.step !== 1 || input.confirmCompany)
        setStep(Math.min(input.step + 1, 7))
      return true
    } catch (e) {
      setError(getErrorMessage(e, 'Nu am putut salva. Încearcă din nou.'))
      return false
    } finally {
      setBusy(false)
    }
  }
  if (role !== 'CarPoster') return <Navigate to="/app" replace />
  if (state?.legacyAccount) return <Navigate to={SRL_ROOT} replace />
  return (
    <ThemeProvider theme={onboardingMuiTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: TOKENS.surface,
          color: TOKENS.ink,
          '& .MuiPaper-root': {
            borderRadius: '16px',
            border: '1px solid',
            borderColor: TOKENS.border,
          },
          '& .MuiAlert-root': { color: TOKENS.ink },
          '& .MuiButton-containedPrimary': { color: TOKENS.ink },
          '& .MuiButton-textPrimary, & .MuiButton-outlinedPrimary, & .MuiLink-root':
            { color: '#146581' },
          '& .MuiTypography-h3': { fontSize: { xs: 36, md: 48 } },
        }}
      >
        <Box
          component="header"
          sx={{
            px: { xs: 2, md: 5 },
            py: 2,
            bgcolor: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box component="img" src={logo} alt="RIDElance" sx={{ width: 140 }} />
          <Typography variant="body2" color="text.secondary">
            Configurare flotă
          </Typography>
        </Box>
        <Box
          sx={{
            maxWidth: 1160,
            mx: 'auto',
            p: { xs: 2, md: 5 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' },
            gap: { xs: 3, md: 5 },
          }}
        >
          <Box component="nav" aria-label="Etape configurare flotă">
            <Typography sx={{ ...displaySx, fontSize: 24, mb: 2 }}>
              Flota ta, organizată.
            </Typography>
            <Stack spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {steps.map((label, index) => (
                <Button
                  key={label}
                  disabled={
                    busy ||
                    !state ||
                    index > state.progress.completedStep ||
                    state.dashboardAllowed ||
                    !!state.progress.checkoutAttemptId
                  }
                  onClick={() => {
                    setStep(index + 1)
                    setError('')
                  }}
                  aria-current={step === index + 1 ? 'step' : undefined}
                  sx={{
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    py: 1.5,
                    bgcolor:
                      step === index + 1 ? TOKENS.primarySoft : 'transparent',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {state && index < state.progress.completedStep
                      ? '✓'
                      : index + 1}
                  </Box>
                  {label}
                </Button>
              ))}
            </Stack>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Pasul {step || 1} din 7 · {steps[(step || 1) - 1]}
              </Typography>
              <LinearProgress variant="determinate" value={(step / 7) * 100} />
            </Box>
          </Box>
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            {error && (
              <Alert severity="error">
                {error}
                {!state && (
                  <Button onClick={() => window.location.reload()}>
                    Reîncearcă
                  </Button>
                )}
              </Alert>
            )}
            {!state ? (
              !error && <CircularProgress />
            ) : state.dashboardAllowed ? (
              <Paper sx={{ p: { xs: 3, md: 5 } }}>
                <Stack spacing={3}>
                  <Chip
                    label="✓ Configurare finalizată"
                    color="success"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                  <Typography variant="h4" sx={displaySx}>
                    Totul este pregătit.
                  </Typography>
                  <Typography>
                    Contul companiei tale RIDElance a fost configurat cu succes.
                  </Typography>
                  <Stack spacing={1}>
                    <Typography>✓ Firmă configurată</Typography>
                    <Typography>✓ Profil administrator configurat</Typography>
                    <Typography>✓ Abonament activ</Typography>
                    <Typography>
                      {state.bankConnected
                        ? '✓ Cont bancar conectat'
                        : 'Cont bancar · De configurat'}
                    </Typography>
                    <Typography>
                      {state.oblioConnected
                        ? '✓ Oblio conectat'
                        : 'Oblio · De configurat'}
                    </Typography>
                  </Stack>
                  <Button variant="contained" href={SRL_ROOT}>
                    Intră în dashboard
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <>
                <Paper
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderTop: `3px solid ${TOKENS.primary}`,
                  }}
                >
                  <Typography variant="overline" color="text.secondary">
                    RIDElance Fleet · {steps[step - 1]}
                  </Typography>
                  <Typography
                    component="h1"
                    sx={{ ...displaySx, fontSize: { xs: 26, md: 34 }, mt: 1 }}
                  >
                    {titles[step - 1]}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                    {step <= 3
                      ? 'Câteva detalii pentru un cont pregătit pentru firma ta.'
                      : step <= 5
                        ? 'Poți reveni la această configurare și din dashboard.'
                        : 'Un singur loc pentru mașini, închirieri și documente.'}
                  </Typography>
                </Paper>
                <Paper sx={{ p: { xs: 2.5, md: 4 } }}>
                  {params.has('payment') && !state.progress.completedAtUtc ? (
                    <Stack spacing={3}>
                      <Alert severity="info">
                        Așteptăm confirmarea plății. Accesul se activează
                        automat după confirmare.
                      </Alert>
                      <Button
                        onClick={() =>
                          void refresh().catch((e) =>
                            setError(
                              getErrorMessage(e, 'Nu am putut verifica plata.'),
                            ),
                          )
                        }
                      >
                        Verifică plata
                      </Button>
                      <Button
                        onClick={() =>
                          window.location.assign('/onboarding-srl')
                        }
                      >
                        Revino la configurare
                      </Button>
                    </Stack>
                  ) : (
                    <FleetStep
                      key={step}
                      step={step}
                      state={state}
                      busy={busy}
                      save={save}
                      refresh={refresh}
                    />
                  )}
                  {step > 1 &&
                    !state.progress.checkoutAttemptId &&
                    !params.has('payment') && (
                      <Button
                        sx={{ mt: 3 }}
                        disabled={busy}
                        onClick={() => {
                          setStep(step - 1)
                          setError('')
                        }}
                      >
                        ← Înapoi
                      </Button>
                    )}
                </Paper>
                <Typography variant="caption" color="text.secondary">
                  Progresul se salvează la fiecare pas. Poți reveni oricând.
                </Typography>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

interface StepProps {
  step: number
  state: FleetState
  busy: boolean
  save: (input: FleetInput) => Promise<boolean>
  refresh: () => Promise<void>
}
function FleetStep({ step, state, busy, save, refresh }: StepProps) {
  const p = state.progress
  const [cui, setCui] = useState(p.company?.cui ?? '')
  const [searching, setSearching] = useState(false)
  const [firstName, setFirstName] = useState(state.firstName)
  const [lastName, setLastName] = useState(state.lastName)
  const [position, setPosition] = useState(
    p.position && positions.includes(p.position)
      ? p.position
      : p.position
        ? 'Altă funcție'
        : '',
  )
  const [other, setOther] = useState(p.position ?? '')
  const [platforms, setPlatforms] = useState(p.platforms)
  const [count, setCount] = useState(String(p.vehicleCount))
  const [cycle, setCycle] = useState(p.cycle || 'Monthly')
  const company = searching ? null : (p.pendingCompany ?? p.company)
  if (step === 1)
    return (
      <Stack spacing={3}>
        {!company ? (
          <>
            <Typography>
              Introdu CUI-ul firmei, iar noi vom completa automat datele
              disponibile.
            </Typography>
            <TextField
              label="CUI / CIF"
              value={cui}
              onChange={(e) => setCui(e.target.value)}
            />
            <Button
              disabled={busy || !cui.trim()}
              variant="contained"
              onClick={async () => {
                if (await save({ step: 1, cui })) setSearching(false)
              }}
            >
              Verifică firma
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6">{company.name}</Typography>
            <Box
              component="dl"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1.4fr' },
                gap: 1.5,
                m: 0,
              }}
            >
              {Object.entries({
                CUI: company.cui,
                'Nr. Registrul Comerțului': company.registrationNumber,
                'Sediu social': company.address,
                Județ: company.county,
                Localitate: company.city,
                'Cod poștal': company.postalCode,
                'Cod CAEN principal': company.caen,
                'Data înregistrării': company.registrationDate,
                'Status firmă': company.status,
                'Plătitor TVA': company.vatPayer ? 'Da' : 'Nu',
                'TVA la încasare':
                  company.vatOnCollection == null
                    ? null
                    : company.vatOnCollection
                      ? 'Da'
                      : 'Nu',
              }).map(([label, value]) => (
                <Box key={label} sx={{ display: 'contents' }}>
                  <Typography component="dt" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography
                    component="dd"
                    sx={{ m: 0, overflowWrap: 'anywhere' }}
                  >
                    {value || 'Indisponibil în ANAF'}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography>Aceasta este firma ta?</Typography>
            <Button
              disabled={busy}
              variant="contained"
              onClick={() => void save({ step: 1, confirmCompany: true })}
            >
              Da, continuă
            </Button>
            {!p.company && (
              <Button disabled={busy} onClick={() => setSearching(true)}>
                Caută altă firmă
              </Button>
            )}
          </>
        )}
      </Stack>
    )
  if (step === 2)
    return (
      <Stack spacing={3}>
        <FleetContactVerification state={state} refresh={refresh} />
        <TextField
          label="Prenume"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
        <TextField
          label="Nume"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />
        <TextField
          select
          label="Funcția în companie"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          {positions.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
        {position === 'Altă funcție' && (
          <TextField
            label="Funcția ta"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
        )}
        <Button
          disabled={
            busy ||
            !firstName.trim() ||
            !lastName.trim() ||
            !position ||
            !state.emailVerified ||
            !state.phoneVerified
          }
          variant="contained"
          onClick={() =>
            void save({
              step: 2,
              firstName,
              lastName,
              position,
              otherPosition: other,
            })
          }
        >
          Continuă
        </Button>
      </Stack>
    )
  if (step === 3)
    return (
      <Stack spacing={3}>
        <Typography>
          Cu ce platforme de ridesharing lucrează flota ta?
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1.5,
          }}
        >
          {['Uber', 'Bolt', 'Blue', 'BlackCab', 'Altele', 'Niciuna'].map(
            (item) => (
              <Button
                key={item}
                aria-pressed={platforms.includes(item)}
                variant={platforms.includes(item) ? 'contained' : 'outlined'}
                sx={{ py: 2 }}
                onClick={() =>
                  setPlatforms((previous) =>
                    item === 'Niciuna'
                      ? ['Niciuna']
                      : previous.includes(item)
                        ? previous.filter((x) => x !== item)
                        : [...previous.filter((x) => x !== 'Niciuna'), item],
                  )
                }
              >
                {item === 'Niciuna' ? 'Momentan cu niciuna' : item}
              </Button>
            ),
          )}
        </Box>
        <TextField
          label="Câte mașini administrezi în prezent?"
          value={count}
          type="number"
          slotProps={{ htmlInput: { min: 0, max: 1000000, step: 1 } }}
          onChange={(e) => setCount(e.target.value)}
          helperText="Poți introduce 0 dacă firma încă își construiește flota."
        />
        <Button
          variant="contained"
          disabled={
            busy ||
            !platforms.length ||
            count === '' ||
            !Number.isInteger(Number(count)) ||
            Number(count) < 0
          }
          onClick={() =>
            void save({ step: 3, platforms, vehicleCount: Number(count) })
          }
        >
          Continuă
        </Button>
      </Stack>
    )
  if (step === 4)
    return (
      <FleetBankStep state={state} busy={busy} save={save} refresh={refresh} />
    )
  if (step === 5)
    return (
      <FleetOblioStep state={state} busy={busy} save={save} refresh={refresh} />
    )
  if (step === 6)
    return (
      <Stack spacing={3}>
        <Stack direction="row" spacing={1}>
          {(['Monthly', 'Annual'] as const).map((value) => (
            <Button
              key={value}
              variant={cycle === value ? 'contained' : 'outlined'}
              onClick={() => setCycle(value)}
            >
              {value === 'Annual' ? 'Anual −10%' : 'Lunar'}
            </Button>
          ))}
        </Stack>
        <Typography variant="h5">RIDElance Fleet</Typography>
        {p.bcrEligibleAtUtc && (
          <Typography
            sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
          >
            {cycle === 'Annual' ? '3.229,20 lei / an' : '299 lei / lună'}
          </Typography>
        )}
        <Typography variant="h3" sx={displaySx}>
          {money(
            cycle === 'Annual'
              ? state.annualAmountBani
              : state.monthlyAmountBani,
          )}{' '}
          <Typography component="span">
            lei / {cycle === 'Annual' ? 'an' : 'lună'}
          </Typography>
        </Typography>
        {cycle === 'Annual' && (
          <Typography>
            269,10 lei/lună echivalent, înainte de beneficiul BCR.
          </Typography>
        )}
        {p.bcrEligibleAtUtc && (
          <Alert severity="success">
            Beneficiu BCR activ ·{' '}
            {cycle === 'Annual'
              ? '300 lei reducere din prima factură anuală, apoi 3.229,20 lei/an.'
              : '−50 lei/lună în primele 6 luni, apoi 299 lei/lună.'}
          </Alert>
        )}
        {p.bcrRequested && !p.bcrEligibleAtUtc && (
          <Alert severity="info">
            Beneficiul BCR se aplică după confirmarea eligibilității.
          </Alert>
        )}
        <Stack spacing={1}>
          {SRL_PLANS[0].features.map((feature, index) => (
            <Typography key={index}>
              ✓{' '}
              {[feature.prefix, feature.strong, feature.text]
                .filter(Boolean)
                .join(' ')}
            </Typography>
          ))}
        </Stack>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() => void save({ step: 6, cycle })}
        >
          Alege Fleet
        </Button>
      </Stack>
    )
  return <FleetPayment state={state} refresh={refresh} />
}

function FleetPayment({
  state,
  refresh,
}: {
  state: FleetState
  refresh: () => Promise<void>
}) {
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pay = async () => {
    setBusy(true)
    setError('')
    try {
      if (!state.progress.checkoutAttemptId)
        await fleetOnboardingService.save({
          step: 7,
          termsAccepted: terms,
          privacyAccepted: privacy,
        })
      await refresh()
      setSecret((await fleetOnboardingService.checkout()).clientSecret)
    } catch (e) {
      setError(getErrorMessage(e, 'Nu am putut deschide plata.'))
    } finally {
      await refresh().catch(() => undefined)
      setBusy(false)
    }
  }
  return (
    <Stack spacing={3}>
      <Typography variant="h5">RIDElance Fleet</Typography>
      <Typography>
        {state.progress.cycle === 'Annual'
          ? 'Abonament anual'
          : 'Abonament lunar'}{' '}
        · {state.progress.company?.name}
      </Typography>
      {state.amountDueBani < state.regularAmountBani && (
        <>
          <Typography sx={{ textDecoration: 'line-through' }}>
            {money(state.regularAmountBani)} lei
          </Typography>
          <Alert severity="success">
            Beneficiu BCR · −
            {money(state.regularAmountBani - state.amountDueBani)} lei
          </Alert>
        </>
      )}
      <Box>
        <Typography color="text.secondary">De plată astăzi</Typography>
        <Typography variant="h3" sx={displaySx}>
          {money(state.amountDueBani)} lei
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {state.progress.cycle === 'Annual'
          ? `Reînnoire anuală la ${money(state.regularAmountBani)} lei.`
          : state.amountDueBani < state.regularAmountBani
            ? '249 lei/lună în primele 6 luni, apoi 299 lei/lună.'
            : 'Reînnoire lunară la 299 lei.'}
      </Typography>
      {!secret ? (
        <>
          <FormControlLabel
            sx={{ m: 0, alignItems: 'center' }}
            control={
              <Checkbox
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                Am citit și accept{' '}
                <Link
                  href="/termeni-si-conditii"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Termenii și Condițiile
                </Link>
              </Typography>
            }
          />
          <FormControlLabel
            sx={{ m: 0, alignItems: 'center' }}
            control={
              <Checkbox
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                Am citit{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Politica de Confidențialitate
                </Link>
              </Typography>
            }
          />
          <Button
            variant="contained"
            disabled={busy || !terms || !privacy}
            onClick={() => void pay()}
          >
            Plătește și intră în RIDElance
          </Button>
        </>
      ) : (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret: secret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {state.progress.checkoutAttemptId && (
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError('')
            try {
              await fleetOnboardingService.cancelCheckout()
              setSecret('')
              await refresh()
            } catch (e) {
              setError(
                getErrorMessage(e, 'Nu am putut închide sesiunea de plată.'),
              )
            } finally {
              setBusy(false)
            }
          }}
        >
          Anulează sesiunea și modifică abonamentul
        </Button>
      )}
    </Stack>
  )
}
