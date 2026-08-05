import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import logo from '../../assets/logo.svg'
import { authService } from '../../services/auth.service'
import { onboardingService } from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { useMotionTokens } from './motion'
import { OnboardingProvider } from './OnboardingProvider'
import { useOnboarding } from './useOnboarding'
import { displaySx, TOKENS } from './onboardingTheme'
import { MobileStepBar, MOBILE_BAR_HEIGHT } from './rail/MobileStepBar'
import { StepRail } from './rail/StepRail'
import { firstActionableStep, type StepView } from './stepModel'

const RAIL_WIDTH = 296

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
      sx={{ borderRadius: `${TOKENS.radius.md}px`, alignItems: 'center', mb: 2 }}
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

function ShellBody() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { step } = useMotionTokens()
  const [searchParams, setSearchParams] = useSearchParams()

  const { state, steps, loading, error, refresh, rejectionAlert, dismissRejectionAlert } = useOnboarding()

  const activeKey = activeKeyFor(location.pathname, steps)

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

  const goToStep = (target: StepView) => {
    if (target.path !== location.pathname) navigate(target.path)
  }

  if (confirmingPayment) {
    return (
      <Box
        sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: TOKENS.surface }}
      >
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
    />
  )

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: TOKENS.surface }}>
      {isMobile && (
        <>
          <MobileStepBar
            steps={steps}
            activeKey={activeKey}
            uncheckingKeys={rejectionAlert?.keys ?? []}
            onSelect={goToStep}
          />
          {/* Spacer pentru bara fixed — sticky nu funcționează (overflow-x: hidden pe #root). */}
          <Box sx={{ height: MOBILE_BAR_HEIGHT + 3 }} />
        </>
      )}

      {!isMobile && (
        <Box sx={{ backgroundColor: TOKENS.paper, borderBottom: `1px solid ${TOKENS.border}` }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.75 }}
          >
            <Box component="img" src={logo} alt="Ridelance" sx={{ height: 32, width: 'auto' }} />
            <Button
              onClick={handleLogout}
              startIcon={<LogoutRoundedIcon sx={{ fontSize: 17 }} />}
              sx={{
                color: TOKENS.textMuted,
                fontWeight: 600,
                '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' },
              }}
            >
              Ieși din cont
            </Button>
          </Stack>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {!isMobile && (
          <>
            {/* Rail fix + spacer, din același motiv: position: sticky e rupt în acest proiect. */}
            <Box
              component="nav"
              aria-label="Pașii înrolării"
              sx={{
                position: 'fixed',
                top: 65,
                bottom: 0,
                left: 0,
                width: RAIL_WIDTH,
                overflowY: 'auto',
                borderRight: `1px solid ${TOKENS.border}`,
                backgroundColor: TOKENS.surface,
                px: 2,
                py: 3,
              }}
            >
              {rail}
            </Box>
            <Box sx={{ width: RAIL_WIDTH, flexShrink: 0 }} />
          </>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 4 } }}>
            <TestSkipBanner />

            {error && (
              <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px`, mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
                <CircularProgress sx={{ color: TOKENS.primary }} />
                <Typography sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>Se încarcă...</Typography>
              </Stack>
            ) : (
              /* Cross-fade între pași — niciun reload, niciun flash de conținut gol. */
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={step}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            )}

            {/* Singura ancoră de ajutor din tot fluxul — adresa, fără frază în jurul ei. */}
            <Box sx={{ mt: 5, textAlign: 'center' }}>
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
          </Container>
        </Box>
      </Box>

      <Snackbar
        open={rejectionAlert !== null}
        autoHideDuration={8000}
        onClose={dismissRejectionAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={dismissRejectionAlert}
          sx={{ borderRadius: `${TOKENS.radius.md}px` }}
        >
          {rejectionAlert?.labels.length === 1
            ? `Pasul „${rejectionAlert.labels[0]}” a fost redeschis — au apărut observații.`
            : `${rejectionAlert?.labels.length} pași au fost redeschiși — au apărut observații.`}
        </Alert>
      </Snackbar>
    </Box>
  )
}

/**
 * Shell-ul onboardingului: un singur layout care nu se demontează niciodată, deci rail-ul,
 * datele și poll-ul supraviețuiesc schimbării de pas.
 */
export default function OnboardingShell() {
  return (
    <OnboardingProvider>
      <ShellBody />
    </OnboardingProvider>
  )
}
