import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  LinearProgress,
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
import { MicroStepProvider } from './MicroStepProvider'
import { useMotionTokens } from './motion'
import { onboardingMuiTheme } from './onboardingMuiTheme'
import { OnboardingProvider } from './OnboardingProvider'
import { displaySx, tabularSx, TOKENS } from './onboardingTheme'
import { MobileStepBar, MOBILE_BAR_HEIGHT } from './rail/MobileStepBar'
import { StepRail } from './rail/StepRail'
import { LockedNavItem } from './shell/LockedNavItem'
import { SidebarSupportBlock } from './shell/SidebarSupportBlock'
import { StepContextPanel } from './shell/StepContextPanel'
import { OnboardingTopBar, TOPBAR_HEIGHT } from './shell/OnboardingTopBar'
import { firstActionableStep, type StepView } from './stepModel'
import { OnboardingSupportContext, type OnboardingSupportValue } from './supportContext'
import { useMicroSteps } from './useMicroSteps'
import { useOnboarding } from './useOnboarding'
import { useOnboardingGate } from './useOnboardingGate'

const RAIL_WIDTH = 280
const CONTEXT_WIDTH = 300
const CONTEXT_WIDTH_NARROW = 260

/** Pasul căruia îi aparține ruta curentă — `/onboarding/pfa/sediu` ține tot de pasul PFA. */
function activeKeyFor(pathname: string, steps: StepView[]): string | null {
  const match = steps
    .filter((step) => pathname === step.path || pathname.startsWith(`${step.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return match?.key ?? null
}

/** Ruta index: trimite driverul unde a rămas — sau direct la ce i-a fost respins. */
export function OnboardingRedirect() {
  const { steps, loading } = useOnboarding()

  if (loading) return null
  const target = firstActionableStep(steps)
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

  return (
    <Alert
      severity="warning"
      sx={{ alignItems: 'center', mb: 2, maxWidth: 720, mx: 'auto' }}
      action={
        <Button
          size="small"
          color="warning"
          variant="outlined"
          disabled={skipping}
          onClick={handleSkip}
          sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          {skipping ? 'Se sare...' : 'Sari peste pasul curent'}
        </Button>
      }
    >
      Mod de testare activ — poți sări peste pași fără documente și fără validare.
      {skipError ? ` ${skipError}` : ''}
    </Alert>
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

      <Stack sx={{ flex: 1, minWidth: 0, gap: 0.4 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="caption" sx={{ ...tabularSx, color: TOKENS.textMuted }}>
            Pasul {position} din {total}
          </Typography>
          <Typography variant="caption" sx={{ ...tabularSx, color: TOKENS.textMuted }}>
            {percent}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={percent}
          aria-label="Progresul înrolării"
          sx={{ height: 4 }}
        />
      </Stack>
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

/** Serviciile care se deschid după înrolare. Pur vizuale cât timp lacătul e pus. */
function SidebarLockedNav({ onBlocked }: { onBlocked: () => void }) {
  const { unlocked } = useOnboardingGate()
  const navigate = useNavigate()

  return (
    <Stack spacing={0.25}>
      <LockedNavItem
        icon={CreditCardRoundedIcon}
        label="Abonamente"
        unlocked={unlocked}
        onOpen={() => navigate('/inregistrare/abonament')}
        onBlockedClick={onBlocked}
      />
      <LockedNavItem
        icon={ShieldRoundedIcon}
        label="Asigurări"
        unlocked={unlocked}
        onOpen={() => navigate('/app/asigurari')}
        onBlockedClick={onBlocked}
      />
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

  // 900px: sub el rail-ul stâng devine bara mobilă. 1200px: sub el rail-ul drept se pliază în
  // acordeonul de deasupra cardului, ca să nu strivim coloana centrală.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const showContextRail = useMediaQuery('(min-width:1200px)')
  const narrowContextRail = useMediaQuery('(max-width:1439px)')

  const { state, documents, steps, loading, error, refresh, rejectionAlert, dismissRejectionAlert } =
    useOnboarding()
  const micro = useMicroSteps()

  const [lockedNotice, setLockedNotice] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  const activeStep = useMemo(() => steps.find((s) => s.key === activeKey) ?? null, [steps, activeKey])

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

  const handleLogout = () => {
    authService.logout()
    navigate('/auth')
  }

  /**
   * „Salvează și continuă mai târziu": nu are ce salva în plus — fiecare răspuns și fiecare
   * document pleacă la server în momentul în care se produc. Confirmăm asta explicit, altfel
   * butonul pare că face ceva ce nu face.
   */
  const handleSaveAndExit = () => {
    setSavedNotice(true)
    window.setTimeout(() => navigate('/app'), 900)
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

  const rail = (
    <StepRail
      steps={steps}
      activeKey={activeKey}
      uncheckingKeys={rejectionAlert?.keys ?? []}
      onSelect={goToStep}
      subSteps={micro.steps}
      onSelectSubStep={micro.goTo}
    />
  )

  const contextPanel = (
    <StepContextPanel
      step={activeStep}
      microSteps={micro.steps}
      current={micro.current}
      documents={documents}
    />
  )

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: TOKENS.surface }}>
      {isMobile ? (
        <>
          <MobileStepBar
            steps={steps}
            activeKey={activeKey}
            uncheckingKeys={rejectionAlert?.keys ?? []}
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
              position={micro.position}
              total={micro.total}
              percent={micro.percent}
              canGoBack={micro.canGoBack}
              onBack={micro.back}
              onSaveAndExit={handleSaveAndExit}
              onLogout={handleLogout}
            />
          </Box>
          <Box sx={{ height: TOPBAR_HEIGHT }} />
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
                top: TOPBAR_HEIGHT,
                bottom: 0,
                left: 0,
                width: RAIL_WIDTH,
                borderRight: `1px solid ${TOKENS.border}`,
                backgroundColor: TOKENS.paper,
                pt: 2.5,
              }}
            >
              <Box sx={{ px: 2 }}>
                <SidebarBrand />
              </Box>

              {/* Doar lista de pași scrolează. Ajutorul nu are voie să dispară sub fold — e exact
                  ce caută cineva blocat la un pas lung. */}
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 1 }}>{rail}</Box>

              <Stack spacing={0.5} sx={{ px: 2, pt: 1, pb: 2, backgroundColor: TOKENS.paper }}>
                <Divider sx={{ mb: 1 }} />
                <SidebarSupportBlock />
                <SidebarLockedNav onBlocked={() => setLockedNotice(true)} />
              </Stack>
            </Stack>
            <Box sx={{ width: RAIL_WIDTH, flexShrink: 0 }} />
          </>
        )}

        <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 6 } }}>
          <TestSkipBanner />

          {error && (
            <Alert severity="error" sx={{ mb: 2, maxWidth: 720, mx: 'auto' }}>
              {error}
            </Alert>
          )}

          {/* Sub 1200px rail-ul din dreapta nu încape: conținutul lui se pliază deasupra cardului. */}
          {!showContextRail && activeStep && (
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                maxWidth: 720,
                mx: 'auto',
                mb: 2,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: `${TOKENS.radius.lg}px`,
                '&::before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: TOKENS.ink }}>
                  Detalii despre pasul curent
                </Typography>
              </AccordionSummary>
              <AccordionDetails>{contextPanel}</AccordionDetails>
            </Accordion>
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
        </Box>

        {showContextRail && (
          <>
            <Box
              component="aside"
              aria-label="Context pentru pasul curent"
              sx={{
                position: 'fixed',
                top: TOPBAR_HEIGHT,
                bottom: 0,
                right: 0,
                width: narrowContextRail ? CONTEXT_WIDTH_NARROW : CONTEXT_WIDTH,
                overflowY: 'auto',
                borderLeft: `1px solid ${TOKENS.border}`,
                backgroundColor: TOKENS.paper,
                p: 3,
              }}
            >
              {contextPanel}
            </Box>
            <Box
              sx={{ width: narrowContextRail ? CONTEXT_WIDTH_NARROW : CONTEXT_WIDTH, flexShrink: 0 }}
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
        open={lockedNotice}
        autoHideDuration={5000}
        onClose={() => setLockedNotice(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setLockedNotice(false)}>
          Poți alege un abonament sau o asigurare după ce finalizezi toți cei 6 pași.
        </Alert>
      </Snackbar>

      <Snackbar
        open={savedNotice}
        autoHideDuration={4000}
        onClose={() => setSavedNotice(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">Progresul a fost salvat. Poți reveni oricând.</Alert>
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
