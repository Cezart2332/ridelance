import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import logo from '../../assets/logo.svg'
import { authService } from '../../services/auth.service'
import type { OnboardingState } from '../../services/onboarding.service'
import { TOKENS } from './onboardingTheme'

interface OnboardingLayoutProps {
  state: OnboardingState | null
  /** Cheia pasului evidențiat în stepper (pagina curentă). */
  activeKey?: string
  children: ReactNode
}

/**
 * Aliasuri pentru cheile pe care le trimit paginile — cheile canonice vin de la server
 * (OnboardingStepCatalog): eligibility, pfa, fiscal, arr, platforms, vehicle.
 */
const KEY_ALIASES: Record<string, string> = {
  autorizatietransport: 'arr',
  vehicul: 'vehicle',
}

function stepVisual(status: string | undefined, isActive: boolean) {
  switch (status) {
    case 'Completed':
      return {
        icon: <CheckRoundedIcon sx={{ fontSize: 16 }} />,
        color: '#2e7d32',
        bg: alpha('#2e7d32', 0.1),
      }
    case 'AwaitingValidation':
      return {
        icon: <HourglassTopRoundedIcon sx={{ fontSize: 15 }} />,
        color: '#b54708',
        bg: alpha('#ed6c02', 0.12),
      }
    case 'Rejected':
      return {
        icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />,
        color: '#b71c1c',
        bg: alpha('#d32f2f', 0.1),
      }
    case 'InProgress':
    case 'NotStarted':
      return {
        icon: null,
        color: isActive ? '#fff' : TOKENS.primaryStrong,
        bg: isActive ? TOKENS.primary : alpha(TOKENS.primary, 0.12),
      }
    default:
      return {
        icon: <LockRoundedIcon sx={{ fontSize: 14 }} />,
        color: TOKENS.textMuted,
        bg: alpha(TOKENS.ink, 0.05),
      }
  }
}

/**
 * Shell-ul paginilor de onboarding: logo, stepper orizontal cu cei 6 pași (derivați pe server),
 * logout și panoul de conținut full-width.
 */
export default function OnboardingLayout({ state, activeKey, children }: OnboardingLayoutProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    authService.logout()
    navigate('/auth')
  }

  const normalizedActive = activeKey ? (KEY_ALIASES[activeKey.toLowerCase()] ?? activeKey.toLowerCase()) : undefined
  const steps = state?.steps ?? []

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: TOKENS.surface, pb: 8 }}>
      {/* Header */}
      <Box sx={{ backgroundColor: TOKENS.paper, borderBottom: `1px solid ${TOKENS.border}` }}>
        <Container maxWidth="md">
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', py: 2 }}
          >
            <Box component="img" src={logo} alt="Ridelance" sx={{ height: 36, width: 'auto' }} />
            <Button
              onClick={handleLogout}
              startIcon={<LogoutRoundedIcon sx={{ fontSize: 17 }} />}
              sx={{
                textTransform: 'none',
                color: TOKENS.textMuted,
                fontWeight: 600,
                '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' },
              }}
            >
              Ieși din cont
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Stepper orizontal — cei 6 pași */}
      {steps.length > 0 && (
      <Box sx={{ backgroundColor: TOKENS.paper, borderBottom: `1px solid ${TOKENS.border}` }}>
        <Container maxWidth="md">
          <Stack
            direction="row"
            sx={{
              py: 2,
              gap: { xs: 1, sm: 2 },
              overflowX: 'auto',
              alignItems: 'center',
            }}
          >
            {steps.map((step, index) => {
              const isActive = normalizedActive === step.key.toLowerCase()
              const visual = stepVisual(step.status, isActive)
              return (
                <Stack
                  key={step.key}
                  direction="row"
                  sx={{ alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}
                >
                  {index > 0 && (
                    <Box sx={{ width: { xs: 14, sm: 28 }, height: 2, backgroundColor: TOKENS.border, borderRadius: 1 }} />
                  )}
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: visual.color,
                        backgroundColor: visual.bg,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        flexShrink: 0,
                      }}
                    >
                      {visual.icon ?? step.order + 1}
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.85rem',
                        color: isActive ? TOKENS.ink : TOKENS.textMuted,
                        whiteSpace: 'nowrap',
                        display: { xs: isActive ? 'block' : 'none', sm: 'block' },
                      }}
                    >
                      {step.label}
                    </Typography>
                  </Stack>
                </Stack>
              )
            })}
          </Stack>
        </Container>
      </Box>
      )}

      {/* Conținut */}
      <Container maxWidth="md" sx={{ pt: 4 }}>
        {children}
        <Typography sx={{ mt: 4, textAlign: 'center', color: TOKENS.textMuted, fontSize: '0.85rem' }}>
          Ai nevoie de ajutor în timpul înrolării? Scrie-ne la{' '}
          <Box
            component="a"
            href="mailto:contact@ridelance.ro"
            sx={{ color: TOKENS.primary, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            contact@ridelance.ro
          </Box>
        </Typography>
      </Container>
    </Box>
  )
}
