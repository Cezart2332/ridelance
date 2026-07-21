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
import { ONBOARDING_SECTIONS } from '../../constants/documentSections'
import { authService } from '../../services/auth.service'
import type { OnboardingState } from '../../services/onboarding.service'
import { TOKENS } from './onboardingTheme'

interface OnboardingLayoutProps {
  state: OnboardingState | null
  /** Cheia secțiunii evidențiate în stepper (pagina curentă). */
  activeKey?: string
  children: ReactNode
}

function stepVisual(status: string | undefined, isActive: boolean) {
  switch (status) {
    case 'Validated':
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
 * Shell-ul paginilor de onboarding: logo, stepper orizontal cu cele 4 secțiuni,
 * logout și panoul de conținut full-width.
 */
export default function OnboardingLayout({ state, activeKey, children }: OnboardingLayoutProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    authService.logout()
    navigate('/auth')
  }

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

      {/* Stepper orizontal */}
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
            {ONBOARDING_SECTIONS.map((section, index) => {
              const sectionState = state?.sections.find((s) => s.key === section.key)
              const isActive = activeKey?.toLowerCase() === section.key.toLowerCase()
              const visual = stepVisual(sectionState?.status, isActive)
              return (
                <Stack
                  key={section.key}
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
                      {visual.icon ?? section.order}
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
                      {section.label}
                    </Typography>
                  </Stack>
                </Stack>
              )
            })}
          </Stack>
        </Container>
      </Box>

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
