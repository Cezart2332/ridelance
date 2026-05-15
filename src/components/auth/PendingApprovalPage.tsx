import { useState, useEffect } from 'react'
import { Box, Button, Container, Paper, Stack, Typography, CircularProgress } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { stripeService } from '../../services/stripe.service'
import logo from '../../assets/logo.svg'

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0, 0, 0, 0.06)',
  textMuted: 'rgba(26, 26, 46, 0.55)',
  radius: { md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    glow: '0 2px 8px rgba(92,203,245,0.18)',
  },
}

export default function PendingApprovalPage({ onLogout, status: initialStatus }: { onLogout: () => void; status?: any }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'Pending' | 'Rejected' | 'Approved' | null>(initialStatus || null)
  const [isLoading, setIsLoading] = useState(!initialStatus)

  useEffect(() => {
    const checkStatus = async () => {
      const sub = await stripeService.getSubscriptionStatus()
      if (sub?.pfaStatus === 'Approved' || sub?.pfaRegistrationType === 'AmPfa') {
        navigate('/app') // This will trigger RoleRedirect and show the correct page
        return
      }
      setStatus(sub?.pfaStatus as any || 'Pending')
      setIsLoading(false)
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [navigate])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const isPending = status === 'Pending'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.surface,
        backgroundImage: `radial-gradient(circle at 80% 0%, ${alpha(TOKENS.primary, 0.1)} 0%, transparent 50%)`,
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack sx={{ alignItems: 'center' }} spacing={4}>
          {/* Logo */}
          <Box
            component="img"
            src={logo}
            alt="Ridelance"
            sx={{ height: 50, width: 'auto', cursor: 'pointer' }}
            onClick={() => navigate('/app')}
          />

          <Paper
            elevation={0}
            sx={{
              width: '100%',
              p: { xs: 4, sm: 6 },
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.md,
              backgroundColor: TOKENS.paper,
              textAlign: 'center',
            }}
          >
            {/* Animated icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: alpha(isPending ? TOKENS.primary : '#ef4444', 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                animation: isPending ? 'pulse 2s ease-in-out infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.08)', opacity: 0.8 },
                },
              }}
            >
              {isPending ? (
                <HourglassEmptyRoundedIcon
                  sx={{
                    fontSize: 40,
                    color: TOKENS.primary,
                    animation: 'spin 3s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '50%': { transform: 'rotate(180deg)' },
                      '100%': { transform: 'rotate(180deg)' },
                    },
                  }}
                />
              ) : (
                <BlockRoundedIcon sx={{ fontSize: 40, color: '#ef4444' }} />
              )}
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.5rem',
                color: TOKENS.ink,
                mb: 2,
                letterSpacing: -0.5,
              }}
            >
              {isPending ? 'Înregistrare în curs de aprobare' : 'Înregistrare respinsă'}
            </Typography>

            <Typography
              sx={{
                color: TOKENS.textMuted,
                fontSize: '1rem',
                lineHeight: 1.75,
                maxWidth: 420,
                mx: 'auto',
                mb: 4,
              }}
            >
              {isPending ? (
                <>
                  Cererea ta de înregistrare PFA a fost primită și este{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: TOKENS.primaryStrong }}>
                    în curs de verificare
                  </Box>{' '}
                  de către echipa Ridelance. Vei fi contactat prin email sau WhatsApp în curând.
                </>
              ) : (
                <>
                  Din păcate, cererea ta de înregistrare PFA a fost{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: '#ef4444' }}>
                    respinsă
                  </Box>
                  . Te rugăm să contactezi echipa Ridelance pentru mai multe detalii sau pentru a reaplica.
                </>
              )}
            </Typography>

            {/* Status badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: TOKENS.radius.full,
                border: `1px solid ${alpha(isPending ? TOKENS.primary : '#ef4444', 0.3)}`,
                bgcolor: alpha(isPending ? TOKENS.primary : '#ef4444', 0.06),
                mb: 4,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isPending ? TOKENS.primary : '#ef4444',
                  animation: isPending ? 'blink 1.5s ease-in-out infinite' : 'none',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                  },
                }}
              />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isPending ? TOKENS.primaryStrong : '#dc2626' }}>
                {isPending ? 'Așteptare aprobare admin' : 'Cerere respinsă'}
              </Typography>
            </Box>
          </Paper>

          {/* Actions */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {!isPending && (
              <Button
                variant="contained"
                onClick={() => navigate('/inregistrare/pfa')}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontWeight: 700,
                  borderRadius: TOKENS.radius.full,
                  color: '#fff',
                  backgroundColor: TOKENS.primary,
                  boxShadow: TOKENS.shadow.glow,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong },
                }}
              >
                Reaplică
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<LogoutRoundedIcon />}
              onClick={onLogout}
              sx={{
                px: 4,
                py: 1.2,
                fontWeight: 700,
                borderRadius: TOKENS.radius.full,
                borderColor: alpha(TOKENS.ink, 0.2),
                color: TOKENS.ink,
                '&:hover': { borderColor: '#ef4444', color: '#ef4444', bgcolor: alpha('#ef4444', 0.04) },
              }}
            >
              Deconectare
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
