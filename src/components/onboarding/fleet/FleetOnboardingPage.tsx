import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
  MenuItem,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { useAppSelector } from '../../../store/hooks'
import { SRL_ROOT } from '../../../config/srlNavigation'
import { ANNUAL_DISCOUNT, SRL_PLANS } from '../../../data/plans'
import { PlanCard } from '../../pricing/PlanCard'
import { PlanPrice } from '../../pricing/PlanPrice'
import { Switcher } from '../../pricing/Switcher'
import {
  fleetOnboardingService,
  type FleetInput,
  type FleetState,
} from '../../../services/fleetOnboarding.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { authService } from '../../../services/auth.service'
import { ROUTES } from '../../../constants/routes'
import { OnboardingCard } from '../micro/OnboardingCard'
import type { MicroStepIcon } from '../microStepTypes'
import { onboardingMuiTheme } from '../onboardingMuiTheme'
import { TOKENS } from '../onboardingTheme'
import { OnboardingChrome } from '../shell/OnboardingChrome'
import { StepIntroCard } from '../shell/StepIntroCard'
import type { StepView } from '../stepModel'
import { FLEET_STEPS, FLEET_STEP_INTRO, fleetStepViews } from './fleetSteps'
import { FleetContactVerification } from './FleetContactVerification'
import { FleetBankStep, FleetOblioStep } from './FleetConnections'

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE || '')

/** Iconița din capul cardului, pe pas. Aceleași chei ca la PFA, ca ecranele să se citească la fel. */
const FLEET_STEP_ICONS: Record<string, MicroStepIcon> = {
  firma: 'folder',
  administrator: 'user',
  flota: 'car',
  banca: 'idCard',
  oblio: 'shield',
  abonament: 'checkCircle',
  plata: 'checkCircle',
}

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
  const navigate = useNavigate()
  const theme = useTheme()
  // Aceeași ruptură ca la PFA: sub 900px rail-ul devine bara mobilă de pași.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
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
  /*
   * Plata confirmată de server ⇒ direct în dashboard.
   *
   * Configurarea nu mai are ce cere: contul e complet și abonamentul activ. Ecranul de dinainte
   * era o recapitulare cu un buton „Intră în dashboard" — un click în plus după singurul lucru
   * pe care omul tocmai îl făcuse. Merge și la o revenire pe /onboarding-srl: dacă totul e gata,
   * pagina n-are niciun rol.
   *
   * Fără buclă cu `FleetAccessGate`: ambele citesc același `dashboardAllowed`, din același
   * răspuns, deci nu se pot contrazice.
   */
  useEffect(() => {
    if (state?.dashboardAllowed) navigate(SRL_ROOT, { replace: true })
  }, [state?.dashboardAllowed, navigate])
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

  // Navigarea prin rail se închide când nu mai are ce muta: la checkout deschis sau după acces.
  const navigationLocked =
    busy || !state || state.dashboardAllowed || !!state.progress.checkoutAttemptId
  const stepViews = fleetStepViews(
    step || 1,
    state?.progress.completedStep ?? 0,
    navigationLocked,
  )
  const def = FLEET_STEPS[Math.max(0, (step || 1) - 1)]
  const goToStep = (target: StepView) => {
    const index = FLEET_STEPS.findIndex((s) => s.key === target.key)
    if (index < 0) return
    setStep(index + 1)
    setError('')
  }
  const canGoBack =
    step > 1 && !state?.progress.checkoutAttemptId && !params.has('payment')
  const goBack = () => {
    if (!canGoBack) return
    setStep(step - 1)
    setError('')
  }
  const handleLogout = () => {
    authService.logout()
    navigate(ROUTES.login)
  }

  return (
    <ThemeProvider theme={onboardingMuiTheme}>
      <OnboardingChrome
        steps={stepViews}
        activeKey={def?.key ?? null}
        onSelectStep={goToStep}
        stepPosition={step || 1}
        stepTotal={FLEET_STEPS.length}
        stepLabel={def?.label ?? null}
        canGoBack={canGoBack}
        onBack={goBack}
        onLogout={handleLogout}
        brandCaption="Onboarding flotă SRL"
        isMobile={isMobile}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 720, mx: 'auto' }}>
            {error}
            {!state && (
              <Button onClick={() => window.location.reload()}>Reîncearcă</Button>
            )}
          </Alert>
        )}

        {!state ? (
          !error && (
            <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: TOKENS.primary }} />
              <Typography sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>
                Se încarcă...
              </Typography>
            </Stack>
          )
        ) : state.dashboardAllowed ? (
          // Efectul de mai sus tocmai a cerut navigarea; ecranul ăsta se vede o clipă, între
          // confirmarea plății și dashboard. Nu e o recapitulare — e continuarea așteptării.
          <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
            <CircularProgress sx={{ color: TOKENS.primary }} />
            <Typography sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>
              Plata e confirmată. Te ducem în dashboard...
            </Typography>
          </Stack>
        ) : (
          <>
            <StepIntroCard
              stepKey={def?.key ?? null}
              position={step || 1}
              total={FLEET_STEPS.length}
              label={def?.label ?? null}
              estimate={null}
              intros={FLEET_STEP_INTRO}
            />

            {params.has('payment') && !state.progress.completedAtUtc ? (
              <OnboardingCard
                eyebrow="PLATĂ"
                icon="checkCircle"
                title="Așteptăm confirmarea plății."
              >
                <Stack spacing={2}>
                  <Typography sx={{ color: TOKENS.textMuted }}>
                    Accesul se activează automat după confirmare.
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      onClick={() =>
                        void refresh().catch((e) =>
                          setError(getErrorMessage(e, 'Nu am putut verifica plata.')),
                        )
                      }
                    >
                      Verifică plata
                    </Button>
                    <Button onClick={() => window.location.assign('/onboarding-srl')}>
                      Revino la configurare
                    </Button>
                  </Stack>
                </Stack>
              </OnboardingCard>
            ) : (
              <OnboardingCard
                eyebrow={def?.eyebrow ?? 'FLOTĂ'}
                icon={FLEET_STEP_ICONS[def?.key ?? ''] ?? 'folder'}
                title={def?.title ?? ''}
              >
                <FleetStep
                  key={step}
                  step={step}
                  state={state}
                  busy={busy}
                  save={save}
                  refresh={refresh}
                />
              </OnboardingCard>
            )}

            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 2, textAlign: 'center', color: TOKENS.textMuted }}
            >
              Progresul se salvează la fiecare pas. Poți reveni oricând.
            </Typography>
          </>
        )}
      </OnboardingChrome>
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
  const [cycle, setCycle] = useState<'Monthly' | 'Annual'>(p.cycle === 'Annual' ? 'Annual' : 'Monthly')
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
            // Doar telefonul: emailul e adresa contului, confirmată la înregistrare. Și el
            // blochează numai când serverul o cere — cât timp SMS-ul nu e configurat, codul
            // n-are cum să ajungă, iar butonul ar rămâne gri fără nicio cale de deblocare.
            (state.contactVerificationRequired && !state.phoneVerified)
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
    return <FleetPlanStep state={state} busy={busy} cycle={cycle} onCycle={setCycle} save={save} />

  return <FleetPayment state={state} refresh={refresh} />
}

/**
 * Pasul de abonament, cu exact cardul de la alegerea planului PFA.
 *
 * Flota își desena propriul card — alt titlu, alt preț, altă listă — deci același pas arăta
 * diferit în funcție de tipul de cont. Diferența reală e doar prețul: PFA are trei planuri cu
 * reduceri care se compun, flota unul singur cu două cicluri, iar sumele vin de pe server.
 */
function FleetPlanStep({
  state,
  busy,
  cycle,
  onCycle,
  save,
}: {
  state: FleetState
  busy: boolean
  cycle: 'Monthly' | 'Annual'
  onCycle: (value: 'Monthly' | 'Annual') => void
  save: (input: FleetInput) => Promise<boolean>
}) {
  const p = state.progress
  const plan = SRL_PLANS[0]
  const annual = cycle === 'Annual'
  const listPriceLei = annual ? plan.pricing.annualTotalLei! : plan.pricing.monthlyLei
  const billedLei = (annual ? state.annualAmountBani : state.monthlyAmountBani) / 100
  const bcrActive = p.bcrEligibleAtUtc != null

  return (
    <Stack spacing={3}>
      {/* Același comutator ca pe pagina publică de Abonamente și la alegerea planului PFA. */}
      <Stack sx={{ alignItems: 'center' }}>
        <Switcher
          value={annual ? 'Annual' : 'Monthly'}
          onChange={onCycle}
          options={[
            { value: 'Monthly', label: 'Lunar' },
            { value: 'Annual', label: 'Anual', badge: `-${Math.round(ANNUAL_DISCOUNT * 100)}%` },
          ]}
        />
      </Stack>

      <PlanCard
        title={plan.title}
        selected={p.cycle === cycle && p.completedStep >= 6}
        onSelect={() => void save({ step: 6, cycle })}
        disabled={busy}
        price={
          <PlanPrice
            monthlyLei={listPriceLei}
            unit={annual ? '/ an' : '/ lună'}
            // Reducerea vine de pe server, nu din bifa BCR a fluxului PFA: la flotă e o
            // eligibilitate confirmată de admin, cu altă formă pe lunar față de anual.
            discounted={false}
            amountLei={billedLei}
            note={
              bcrActive
                ? annual
                  ? `beneficiu BCR: 300 lei din prima factură, apoi ${plan.pricing.annualTotalLei!.toLocaleString('ro-RO')} lei/an`
                  : `beneficiu BCR: primele 6 luni, apoi ${plan.pricing.monthlyLei} lei/lună`
                : undefined
            }
            size="md"
          />
        }
        priceNote={annual ? plan.noteAnnual : plan.noteMonthly}
        belowPrice={
          p.bcrRequested && !bcrActive ? (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Beneficiul BCR se aplică după confirmarea eligibilității.
            </Alert>
          ) : undefined
        }
        summary={plan.summary}
        intro={plan.intro}
        features={plan.features.map((f) =>
          [f.prefix, f.strong, f.text].filter(Boolean).join(' '),
        )}
        footnote={plan.footnote}
        cta={plan.cta}
      />
    </Stack>
  )
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
  const annual = state.progress.cycle === 'Annual'
  const discounted = state.amountDueBani < state.regularAmountBani

  return (
    <Stack spacing={3}>
      {/*
        Prețul prin `PlanPrice`, ca peste tot în produs. Aici era scris de mână, cu fontul de
        titlu (`displaySx`) și o scară proprie — singurul loc din onboarding unde apărea alt font
        în interiorul unui card.
      */}
      <Box>
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem' }}>
          RIDElance Fleet · {annual ? 'abonament anual' : 'abonament lunar'} ·{' '}
          {state.progress.company?.name}
        </Typography>
        <PlanPrice
          monthlyLei={state.regularAmountBani / 100}
          unit={annual ? '/ an' : '/ lună'}
          discounted={false}
          amountLei={state.amountDueBani / 100}
          note={
            annual
              ? `reînnoire anuală la ${money(state.regularAmountBani)} lei`
              : discounted
                ? '249 lei/lună în primele 6 luni, apoi 299 lei/lună'
                : 'reînnoire lunară la 299 lei'
          }
          size="md"
        />
      </Box>

      {discounted && (
        <Alert severity="success">
          Beneficiu BCR · −{money(state.regularAmountBani - state.amountDueBani)} lei
        </Alert>
      )}
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
