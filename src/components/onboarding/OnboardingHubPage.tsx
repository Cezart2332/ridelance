import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  ONBOARDING_SECTIONS,
  type OnboardingSectionConfig,
} from '../../constants/documentSections'
import type { DocumentSummary } from '../../services/document.service'
import { onboardingService } from '../../services/onboarding.service'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, sectionStatusChipSx, sectionStatusLabel } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

const STEP_STATUS_LABELS: Record<string, string> = {
  Locked: 'Blocat',
  InProgress: 'În lucru',
  AwaitingValidation: 'În validare',
  Completed: 'Finalizat',
}

function requiredDocsProgress(section: OnboardingSectionConfig, documents: DocumentSummary[]) {
  const requiredDocs = (section.docs ?? []).filter(
    (d) => !(section.optionalDocIds ?? []).includes(d.id),
  )
  const uploaded = requiredDocs.filter((d) =>
    documents.some(
      (doc) => d.categories.includes(doc.category) && doc.status.toLowerCase() !== 'rejected',
    ),
  ).length
  return { uploaded, total: requiredDocs.length }
}

export default function OnboardingHubPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { state, documents, loading, error, refresh } = useOnboardingState()

  // DOAR PENTRU TESTARE — de șters odată cu onboardingService.skipStep().
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)
  const handleTestSkip = async () => {
    setSkipping(true)
    setSkipError(null)
    try {
      await onboardingService.skipStep()
      await refresh()
    } catch {
      setSkipError('Nu am putut sări peste pas. Completează întâi formularul PFA.')
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
            Completează secțiunile pe rând. După fiecare secțiune, echipa RIDElance o verifică
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

        <Stack spacing={1.5}>
          {ONBOARDING_SECTIONS.map((section) => {
            const sectionState = state?.sections.find((s) => s.key === section.key)
            const status = sectionState?.status ?? 'Locked'
            const locked = status === 'Locked'
            const progress = section.docs ? requiredDocsProgress(section, documents) : null
            const target =
              section.key === 'Pfa' ? '/onboarding/pfa' : `/onboarding/sections/${section.key}`

            return (
              <Paper
                key={section.key}
                elevation={0}
                sx={{
                  borderRadius: `${TOKENS.radius.lg}px`,
                  border: `1px solid ${status === 'Rejected' ? alpha('#d32f2f', 0.3) : TOKENS.border}`,
                  backgroundColor: TOKENS.paper,
                  overflow: 'hidden',
                  opacity: locked ? 0.65 : 1,
                }}
              >
                <ButtonBase
                  disabled={locked}
                  onClick={() => navigate(target)}
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
                        width: 40,
                        height: 40,
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
                      {locked ? <LockRoundedIcon sx={{ fontSize: 18 }} /> : section.order}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 750, fontSize: '1rem', color: TOKENS.ink }}>
                          {section.label}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={sectionStatusLabel(status)}
                          sx={{ fontWeight: 700, fontSize: '0.72rem', ...sectionStatusChipSx(status) }}
                        />
                      </Stack>
                      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', mt: 0.3 }}>
                        {section.description}
                      </Typography>

                      {progress && !locked && (
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress.total === 0 ? 0 : (progress.uploaded / progress.total) * 100}
                            sx={{
                              flex: 1,
                              maxWidth: 220,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: alpha(TOKENS.ink, 0.06),
                              '& .MuiLinearProgress-bar': { backgroundColor: TOKENS.primary, borderRadius: 3 },
                            }}
                          />
                          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', fontWeight: 600 }}>
                            {progress.uploaded}/{progress.total} documente
                          </Typography>
                        </Stack>
                      )}

                      {status === 'Rejected' && sectionState?.note && (
                        <Alert severity="error" sx={{ mt: 1.2, borderRadius: `${TOKENS.radius.md}px`, py: 0.3 }}>
                          {sectionState.note}
                        </Alert>
                      )}
                      {status === 'AwaitingValidation' && (
                        <Typography sx={{ color: '#b54708', fontSize: '0.8rem', fontWeight: 600, mt: 0.8 }}>
                          Echipa RIDElance verifică această secțiune. Te anunțăm când e validată.
                        </Typography>
                      )}
                    </Box>

                    {!locked && (
                      <ChevronRightRoundedIcon sx={{ color: TOKENS.textMuted, flexShrink: 0 }} />
                    )}
                  </Stack>
                </ButtonBase>
              </Paper>
            )
          })}
        </Stack>

        {/* Cei 6 pași — status derivat pe server, cu deblocare secvențială. */}
        {state?.steps && state.steps.length > 0 && (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: TOKENS.ink, mt: 1 }}>
              Pașii onboardingului
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', mt: 0.3, mb: 1.5 }}>
              Îi parcurgi pe rând. Fiecare pas se deblochează după ce l-ai finalizat pe cel dinainte.
            </Typography>

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
