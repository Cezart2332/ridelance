import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Navigate, useNavigate } from 'react-router-dom'

import { StepStatusIcon } from './rail/StepStatusIcon'
import { TOKENS } from './onboardingTheme'
import { stepStateLabel } from './stepModel'
import { useOnboarding } from './useOnboarding'

/**
 * Ecranul de după ultimul pas: șoferul și-a făcut partea peste tot, iar restul e al nostru.
 *
 * Până acum nu exista. Cine termina ultimul pas era trimis înapoi la primul pas nevalidat, fiindcă
 * „primul nefinalizat" era singura țintă de navigare — deci onboardingul părea că nu se termină.
 *
 * Arată fiecare pas cu starea lui: bifă pe ce e validat, clepsidră pe ce se verifică, semn de
 * exclamare pe ce a fost respins, cu drum direct înapoi în el. Când adminul validează ultimul pas,
 * shell-ul îl duce singur la alegerea abonamentului — starea se reîmprospătează periodic.
 */
export default function OnboardingDonePage() {
  const navigate = useNavigate()
  const { state, steps, loading } = useOnboarding()

  if (loading || !state) return null

  // Ajuns aici cu ceva încă de completat: îl trimitem acolo, nu îi spunem că a terminat.
  if (state.currentStep !== null) {
    const pending = steps.find((s) => s.key === state.currentStep)
    return <Navigate to={pending?.path ?? '/onboarding'} replace />
  }

  const rejected = steps.filter((s) => s.state === 'rejected')
  const validated = steps.filter((s) => s.state === 'approved').length

  return (
    <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: `${TOKENS.radius.xl}px`,
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.md,
          backgroundColor: TOKENS.paper,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(TOKENS.pendingBase, 0.1),
            mx: 'auto',
            mb: 2,
          }}
        >
          <HourglassTopRoundedIcon sx={{ fontSize: 30, color: TOKENS.pending }} />
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink, mb: 1 }}>
          Ai terminat onboardingul
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', color: TOKENS.textMuted, maxWidth: 520, mx: 'auto' }}>
          Un om din echipa RIDElance se uită acum peste tot ce ai completat. Dacă găsim ceva de
          corectat, te anunțăm pe email și în aplicație, cu exact ce trebuie refăcut.
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', color: TOKENS.textMuted, maxWidth: 520, mx: 'auto', mt: 1.5 }}>
          Când totul e validat, te ducem direct la alegerea abonamentului. Nu trebuie să aștepți pe
          această pagină.
        </Typography>

        <Typography sx={{ mt: 2.5, fontSize: '0.85rem', fontWeight: 700, color: TOKENS.ink }}>
          {validated} din {steps.length} pași validați
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: `${TOKENS.radius.lg}px`,
          border: `1px solid ${TOKENS.border}`,
          backgroundColor: TOKENS.paper,
          overflow: 'hidden',
        }}
      >
        {steps.map((step, index) => (
          <Stack
            key={step.key}
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              px: 2.5,
              py: 1.6,
              borderTop: index === 0 ? 'none' : `1px solid ${TOKENS.border}`,
            }}
          >
            <StepStatusIcon state={step.state} order={step.order} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: TOKENS.ink }}>
                {step.label}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted }}>
                {step.state === 'rejected' && step.reason ? step.reason : stepStateLabel(step.state)}
              </Typography>
            </Box>
            {(step.state === 'rejected' || step.state === 'pending_review') && (
              <Button
                size="small"
                variant={step.state === 'rejected' ? 'contained' : 'text'}
                onClick={() => navigate(step.path)}
                sx={{ flexShrink: 0, fontWeight: 700 }}
              >
                {step.state === 'rejected' ? 'Corectează' : 'Vezi pasul'}
              </Button>
            )}
          </Stack>
        ))}
      </Paper>

      {rejected.length > 0 && (
        <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted, textAlign: 'center' }}>
          {rejected.length === 1
            ? 'Un pas are observații de la echipă. După ce îl corectezi, intră din nou în verificare.'
            : `${rejected.length} pași au observații de la echipă. După ce îi corectezi, intră din nou în verificare.`}
        </Typography>
      )}
    </Stack>
  )
}
