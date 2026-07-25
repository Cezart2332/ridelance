import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { onboardingService } from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

const STEP_STATUS_LABELS: Record<string, string> = {
  Locked: 'Blocat',
  InProgress: 'În lucru',
  AwaitingValidation: 'În validare',
  Completed: 'Finalizat',
}

export default function OnboardingHubPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { state, loading, error, refresh } = useOnboardingState()

  // DOAR PENTRU TESTARE — de șters odată cu onboardingService.skipStep().
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)
  const handleTestSkip = async () => {
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

  // Onboarding complet → urmează plata abonamentului
  useEffect(() => {
    if (state?.allSectionsValidated) {
      navigate('/inregistrare/abonament', { replace: true })
    }
  }, [state?.allSectionsValidated, navigate])

  if (loading || confirmingPayment) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: TOKENS.surface,
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
          <Typography sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>
            {confirmingPayment ? 'Se confirmă plata...' : 'Se încarcă...'}
          </Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <OnboardingLayout state={state}>
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            Înrolarea contului tău
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Parcurgi cei 6 pași pe rând. După fiecare pas, echipa RIDElance verifică documentele
            și îți deblochează pasul următor. La final activezi abonamentul și primești acces la platformă.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

        {/* DOAR PENTRU TESTARE — vizibil doar când backendul are Onboarding:EnableTestSkip=true. */}
        {state?.testSkipEnabled && (
          <Alert
            severity="warning"
            sx={{ borderRadius: `${TOKENS.radius.md}px`, alignItems: 'center' }}
            action={
              <Button
                size="small"
                color="warning"
                variant="outlined"
                disabled={skipping}
                onClick={handleTestSkip}
                sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {skipping ? 'Se sare...' : 'Sari peste pasul curent'}
              </Button>
            }
          >
            Mod de testare activ — poți sări peste pași fără documente și fără validare.
            {skipError ? ` ${skipError}` : ''}
          </Alert>
        )}

        {/* Cei 6 pași — unicul onboarding, status derivat pe server, cu deblocare secvențială. */}
        {state?.steps && state.steps.length > 0 && (
          <Box>
            <Stack spacing={1.5}>
              {state.steps.map((step) => {
                const locked = step.status === 'Locked'
                return (
                  <Paper
                    key={step.key}
                    elevation={0}
                    sx={{
                      borderRadius: `${TOKENS.radius.lg}px`,
                      border: `1px solid ${TOKENS.border}`,
                      backgroundColor: TOKENS.paper,
                      overflow: 'hidden',
                      opacity: locked ? 0.65 : 1,
                    }}
                  >
                    <ButtonBase
                      disabled={locked}
                      onClick={() => navigate(step.path)}
                      sx={{
                        width: '100%',
                        display: 'block',
                        textAlign: 'left',
                        p: 2.5,
                        '&:hover': locked ? {} : { backgroundColor: alpha(TOKENS.primary, 0.02) },
                      }}
                    >
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(TOKENS.primary, locked ? 0.06 : 0.12),
                            color: locked ? TOKENS.textMuted : TOKENS.primaryStrong,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {locked ? <LockRoundedIcon sx={{ fontSize: 17 }} /> : step.order}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontWeight: 750, fontSize: '1rem', color: TOKENS.ink }}>
                              {step.label}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={STEP_STATUS_LABELS[step.status] ?? step.status}
                              color={step.status === 'Completed' ? 'success' : 'default'}
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
                          </Stack>
                          {step.blockReason && (
                            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.82rem', mt: 0.3 }}>
                              {step.blockReason}
                            </Typography>
                          )}
                        </Box>

                        {!locked && <ChevronRightRoundedIcon sx={{ color: TOKENS.textMuted, flexShrink: 0 }} />}
                      </Stack>
                    </ButtonBase>
                  </Paper>
                )
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </OnboardingLayout>
  )
}
