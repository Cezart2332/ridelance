import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { ROUTES } from '../../constants/routes'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Stack,
  ThemeProvider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import logo from '../../assets/logo.svg'
import { authService } from '../../services/auth.service'
import { onboardingService } from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { OfficeBookingDialog } from './dialogs/OfficeBookingDialog'
import { SupportEmailDialog } from './dialogs/SupportEmailDialog'
import { OnboardingDevTools } from './devtools/OnboardingDevTools'
import { MicroStepProvider } from './MicroStepProvider'
import { useMotionTokens } from './motion'
import { onboardingMuiTheme } from './onboardingMuiTheme'
import { OnboardingProvider } from './OnboardingProvider'
import { displaySx, TOKENS } from './onboardingTheme'
import { SHELL, SHELL_LAYOUT } from './shellTokens'
import { MobileStepBar, MOBILE_BAR_HEIGHT } from './rail/MobileStepBar'
import { RightRail } from './rail/RightRail'
import { StepRail } from './rail/StepRail'
import { SidebarSupportBlock } from './shell/SidebarSupportBlock'
import { OnboardingTopBar } from './shell/OnboardingTopBar'
import { StepProgressRing } from './shell/StepProgressRing'
import { firstActionableStep, stepEstimate, type StepView } from './stepModel'
import { OnboardingSupportContext, type OnboardingSupportValue } from './supportContext'
import { useMicroSteps } from './useMicroSteps'
import { useOnboarding } from './useOnboarding'

const RAIL_WIDTH = 280

/** Pasul căruia îi aparține ruta curentă — `/onboarding/pfa/sediu` ține tot de pasul PFA. */
function activeKeyFor(pathname: string, steps: StepView[]): string | null {
  const match = steps
    .filter((step) => pathname === step.path || pathname.startsWith(`${step.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return match?.key ?? null
}

/** Ruta index: trimite driverul unde a rămas — pasul pe care serverul îl declară activ. */
export function OnboardingRedirect() {
  const { steps, state, loading } = useOnboarding()

  if (loading) return null
  const target = firstActionableStep(steps, state?.currentStep)
  return <Navigate to={target?.path ?? '/onboarding/eligibility'} replace />
}

/** DOAR PENTRU TESTARE — vizibil doar când backendul are Onboarding:EnableTestSkip=true. */
function TestSkipBanner() {
  const { state, refresh } = useOnboarding()
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)

  if (!state?.testSkipEnabled) return null

  const handleSkip = async () => {
    setSkipping(true)
    setSkipError(null)
    try {
      await onboardingService.skipStep()
      await refresh()
    } catch (err) {
      setSkipError(getErrorMessage(err, 'Nu am putut sări peste pas.'))
    } finally {
      setSkipping(false)
    }
  }

  // Bandă îngustă, de tip debug — nu card, nu iconiță mare. Trebuie să fie evident că nu e
  // parte din produs, altfel arată ca o funcție pe care userul crede că o are.
  return (
    <Box
      role="status"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 0.75,
        backgroundColor: SHELL.warnSoft,
        borderBottom: `1px solid ${SHELL.warn}`,
        fontSize: 12,
        color: SHELL.warn,
      }}
    >
      <Box component="span" sx={{ fontWeight: 700 }}>
        MOD DE TESTARE
      </Box>
      <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
        Pașii se pot sări fără documente și fără validare.{skipError ? ` ${skipError}` : ''}
      </Box>
      <Button
        size="small"
        disabled={skipping}
        onClick={handleSkip}
        sx={{ color: SHELL.warn, fontWeight: 700, textTransform: 'none', minWidth: 0, p: 0 }}
      >
        {skipping ? 'Se sare…' : 'Sari peste pas'}
      </Button>
    </Box>
  )
}

/**
 * Pe telefon nu încap două bare fixate, iar `MobileStepBar` numără pașii mari. Micro-progresul
 * primește o bandă proprie, care curge cu pagina — dar rămâne primul lucru de sub bară.
 */
function MobileMicroBar({
  position,
  total,
  percent,
  canGoBack,
  onBack,
}: {
  position: number
  total: number
  percent: number
  canGoBack: boolean
  onBack: () => void
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        px: 2,
        py: 1,
        backgroundColor: TOKENS.paper,
        borderBottom: `1px solid ${TOKENS.border}`,
      }}
    >
      <Button
        onClick={onBack}
        disabled={!canGoBack}
        startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 17 }} />}
        size="small"
        sx={{ color: TOKENS.textMuted, flexShrink: 0 }}
      >
        Înapoi
      </Button>

      <StepProgressRing position={position} total={total} percent={percent} size={34} />
    </Stack>
  )
}

/** Brandul din capul rail-ului. */
function SidebarBrand() {
  return (
    <Stack spacing={0.25} sx={{ px: 1.5, pb: 1 }}>
      <Box component="img" src={logo} alt="RIDElance" sx={{ height: 24, width: 'auto', mb: 0.5 }} />
      <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
        Onboarding PFA ridesharing
      </Typography>
    </Stack>
  )
}

/**
 * Corpul shell-ului. Are nevoie de micro-pași (topbar, rail-ul din dreapta, sub-pașii din stânga),
 * deci stă sub `MicroStepProvider` — de asta e separat de `OnboardingShell`.
 */
function ShellBody({ activeKey }: { activeKey: string | null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const { step: stepMotion } = useMotionTokens()
  const [searchParams, setSearchParams] = useSearchParams()

  // Sub 900px rail-ul stâng devine bara mobilă.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  // Sub 1200px rail-ul dreapta nu mai are loc lateral: coboară sub conținut, ca secțiune normală.
  const showRightRail = useMediaQuery('(min-width:1200px)')

  const { state, steps, loading, error, refresh, rejectionAlert, dismissRejectionAlert } =
    useOnboarding()
  const micro = useMicroSteps()


  // Întoarcerea din Stripe după plata înființării PFA: webhookul poate întârzia,
  // așa că facem poll până apare plata (max 30s).
  const [confirmingPayment, setConfirmingPayment] = useState(searchParams.get('pfa_setup_paid') === '1')
  const paymentPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!confirmingPayment) return
    const startedAt = Date.now()
    paymentPollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > 30_000) {
        if (paymentPollRef.current) clearInterval(paymentPollRef.current)
        paymentPollRef.current = null
        setConfirmingPayment(false)
        return
      }
      const nextState = await onboardingService.getState().catch(() => null)
      if (nextState?.hasPaidInfiintare) {
        if (paymentPollRef.current) clearInterval(paymentPollRef.current)
        paymentPollRef.current = null
        setConfirmingPayment(false)
        const next = new URLSearchParams(searchParams)
        next.delete('pfa_setup_paid')
        next.delete('session_id')
        setSearchParams(next, { replace: true })
        void refresh()
      }
    }, 2500)
    return () => {
      if (paymentPollRef.current) clearInterval(paymentPollRef.current)
      paymentPollRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmingPayment])

  // Onboarding complet → urmează plata abonamentului.
  useEffect(() => {
    if (state?.allSectionsValidated) {
      navigate('/inregistrare/abonament', { replace: true })
    }
  }, [state?.allSectionsValidated, navigate])

  // URL direct pe un pas blocat: backendul ar refuza oricum orice scriere de acolo, deci nu-l
  // lăsăm să deschidă un ecran care arată funcțional. Redirect la pasul activ, cu explicație.
  //
  // Motivul călătorește prin location state, nu prin `useState`: altfel ar trebui setat dintr-un
  // effect (cascading render) și s-ar pierde exact la navigarea care îl produce.
  const lockedNotice = (location.state as { blockedStep?: string } | null)?.blockedStep ?? null

  useEffect(() => {
    if (loading || !activeKey) return
    const active = steps.find((s) => s.key === activeKey)
    if (!active || active.state !== 'locked') return

    const target = firstActionableStep(steps, state?.currentStep)
    if (!target || target.key === activeKey) return

    navigate(target.path, {
      replace: true,
      state: { blockedStep: active.reason ?? `Pasul „${active.label}” nu este încă deblocat.` },
    })
  }, [loading, activeKey, steps, state?.currentStep, navigate])

  const dismissLockedNotice = () => navigate(location.pathname, { replace: true, state: null })

  const handleLogout = () => {
    authService.logout()
    navigate(ROUTES.login)
  }

  const goToStep = (target: StepView) => {
    if (target.path !== location.pathname) navigate(target.path)
  }

  if (confirmingPayment) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: TOKENS.surface }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
          <Typography sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>Se confirmă plata...</Typography>
        </Stack>
      </Box>
    )
  }

  const currentStepView = steps.find((s) => s.key === activeKey) ?? null

  const rail = (
    <StepRail
      steps={steps}
      activeKey={activeKey}
      onSelect={goToStep}
      estimate={stepEstimate(currentStepView)}
    />
  )

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: SHELL.bg.app }}>
      {/*
        Bannerul de mod dev și panoul flotant. În build-ul de producție componenta se reduce la
        `null` — vezi `OnboardingDevTools` (spec fix-uri §13.1/§13.6).
      */}
      <OnboardingDevTools />

      {isMobile ? (
        <>
          <MobileStepBar
            steps={steps}
            activeKey={activeKey}
            onSelect={goToStep}
          />
          {/* Spacer pentru bara fixed — sticky nu funcționează (overflow-x: hidden pe #root). */}
          <Box sx={{ height: MOBILE_BAR_HEIGHT + 3 }} />
          <MobileMicroBar
            position={micro.position}
            total={micro.total}
            percent={micro.percent}
            canGoBack={micro.canGoBack}
            onBack={micro.back}
          />
        </>
      ) : (
        <>
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3 }}>
            <OnboardingTopBar
              stepPosition={Math.max(1, steps.findIndex((s) => s.key === activeKey) + 1)}
              stepTotal={Math.max(steps.length, 1)}
              stepLabel={steps.find((s) => s.key === activeKey)?.label ?? null}
              canGoBack={micro.canGoBack}
              onBack={micro.back}
              onLogout={handleLogout}
            />
            <TestSkipBanner />
          </Box>
          <Box sx={{ height: SHELL_LAYOUT.topbarHeight }} />
        </>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {!isMobile && (
          <>
            {/* Rail fix + spacer, din același motiv: position: sticky e rupt în acest proiect. */}
            <Stack
              component="nav"
              aria-label="Pașii înrolării"
              sx={{
                position: 'fixed',
                top: SHELL_LAYOUT.topbarHeight,
                bottom: 0,
                left: 0,
                width: RAIL_WIDTH,
                borderRight: `1px solid ${SHELL.border.subtle}`,
                backgroundColor: SHELL.bg.surface,
                pt: 2.5,
              }}
            >
              <Box sx={{ px: 2 }}>
                <SidebarBrand />
              </Box>

              {/* Doar lista de pași scrolează. Ajutorul nu are voie să dispară sub fold — e exact
                  ce caută cineva blocat la un pas lung. */}
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 1 }}>{rail}</Box>

              {/* Fără divider: cardul de ajutor se separă singur de listă. */}
              <Box sx={{ px: 2, pt: 1, pb: 2, backgroundColor: SHELL.bg.surface }}>
                <SidebarSupportBlock />
              </Box>
            </Stack>
            <Box sx={{ width: RAIL_WIDTH, flexShrink: 0 }} />
          </>
        )}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: { xs: 2, md: 4 },
            py: { xs: 2.5, md: 6 },
            // Cardul central își păstrează lățimea: diferența pentru rail-ul dreapta se absoarbe
            // din gutter-ele exterioare, nu din conținut.
            maxWidth: SHELL_LAYOUT.contentMaxWidth + 128,
            mx: 'auto',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2, maxWidth: 720, mx: 'auto' }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: TOKENS.primary }} />
              <Typography sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>Se încarcă...</Typography>
            </Stack>
          ) : (
            /* Cross-fade între pașii mari. Micro-pașii au propria tranziție, în runner. */
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={stepMotion}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          )}

          {!showRightRail && (
            <Box sx={{ mt: 4 }}>
              <RightRail step={currentStepView} loading={loading} />
            </Box>
          )}
        </Box>

        {showRightRail && (
          <>
            {/* Fix + spacer, ca și rail-ul stâng: `sticky` e rupt de overflow-x: hidden pe #root. */}
            <Box
              component="aside"
              aria-label="Progresul pasului curent"
              sx={{
                position: 'fixed',
                top: SHELL_LAYOUT.topbarHeight,
                bottom: 0,
                right: 0,
                width: { md: SHELL_LAYOUT.rightRailNarrow, xl: SHELL_LAYOUT.rightRail },
                overflowY: 'auto',
                borderLeft: `1px solid ${SHELL.border.subtle}`,
                backgroundColor: SHELL.bg.app,
                px: 2,
                py: 2.5,
              }}
            >
              <RightRail step={currentStepView} loading={loading} />
            </Box>
            <Box
              sx={{
                width: { md: SHELL_LAYOUT.rightRailNarrow, xl: SHELL_LAYOUT.rightRail },
                flexShrink: 0,
              }}
            />
          </>
        )}
      </Box>

      {/* Pe mobil, ajutorul nu are unde sta în rail — rămâne ancorat sub conținut. */}
      {isMobile && (
        <Box sx={{ px: 2, pb: 4, textAlign: 'center' }}>
          <Box
            component="a"
            href="mailto:contact@ridelance.ro"
            sx={{
              ...displaySx,
              fontSize: '0.85rem',
              color: TOKENS.textMuted,
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            contact@ridelance.ro
          </Box>
        </Box>
      )}

      <Snackbar
        open={rejectionAlert !== null}
        autoHideDuration={8000}
        onClose={dismissRejectionAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={dismissRejectionAlert}>
          {rejectionAlert?.labels.length === 1
            ? `Pasul „${rejectionAlert.labels[0]}” a fost redeschis — au apărut observații.`
            : `${rejectionAlert?.labels.length} pași au fost redeschiși — au apărut observații.`}
        </Alert>
      </Snackbar>

      <Snackbar
        open={lockedNotice !== null}
        autoHideDuration={6000}
        onClose={dismissLockedNotice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={dismissLockedNotice}>
          {lockedNotice}
        </Alert>
      </Snackbar>
    </Box>
  )
}

/** Dialogurile de suport, montate o singură dată, deasupra întregului flux. */
function SupportHost({ activeKey, children }: { activeKey: string | null; children: React.ReactNode }) {
  const { state, steps } = useOnboarding()
  const [emailOpen, setEmailOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

  const stepLabel = steps.find((s) => s.key === activeKey)?.label

  const value: OnboardingSupportValue = useMemo(
    () => ({ openEmail: () => setEmailOpen(true), openBooking: () => setBookingOpen(true) }),
    [],
  )

  return (
    <OnboardingSupportContext.Provider value={value}>
      {children}

      <SupportEmailDialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        stepLabel={stepLabel}
        applicationId={state?.pfaRegistrationId}
      />
      <OfficeBookingDialog open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </OnboardingSupportContext.Provider>
  )
}

/** Compunerea contextelor. `activeKey` se calculează o dată și coboară în toate. */
function ShellWithContexts() {
  const location = useLocation()
  const { steps } = useOnboarding()
  const activeKey = activeKeyFor(location.pathname, steps)

  return (
    <SupportHost activeKey={activeKey}>
      <MicroStepProvider activeKey={activeKey}>
        <ShellBody activeKey={activeKey} />
      </MicroStepProvider>
    </SupportHost>
  )
}

/**
 * Shell-ul onboardingului: un singur layout care nu se demontează niciodată, deci rail-urile,
 * topbarul, datele și poll-ul supraviețuiesc schimbării de pas — și de micro-pas.
 */
export default function OnboardingShell() {
  return (
    <ThemeProvider theme={onboardingMuiTheme}>
      <OnboardingProvider>
        <ShellWithContexts />
      </OnboardingProvider>
    </ThemeProvider>
  )
}
