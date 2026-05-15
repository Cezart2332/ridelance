import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Stack,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { authService } from '../../services/auth.service'
import logo from '../../assets/logo.svg'

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0,0,0,0.06)',
  textMuted: 'rgba(26,26,46,0.55)',
  radius: { md: 4, lg: 6, xl: 8, full: 50 },
  shadow: {
    md: '0 4px 12px rgba(0,0,0,0.05)',
    glow: '0 8px 32px rgba(92,203,245,0.15)',
  },
}

export default function PendingAccessPage() {
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      // Get next Monday at 15:00
      let nextMonday = new Date()
      nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7))
      nextMonday.setHours(15, 0, 0, 0)

      // If it's already past Monday 15:00 today, move to next week
      if (now > nextMonday) {
        nextMonday.setDate(nextMonday.getDate() + 7)
      }

      const difference = nextMonday.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate('/auth')
  }

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <Box sx={{ textAlign: 'center', minWidth: { xs: 60, sm: 80 } }}>
      <Typography
        sx={{
          fontSize: { xs: '1.8rem', sm: '2.5rem' },
          fontWeight: 800,
          color: TOKENS.ink,
          lineHeight: 1,
        }}
      >
        {value.toString().padStart(2, '0')}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: TOKENS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          mt: 0.5,
        }}
      >
        {label}
      </Typography>
    </Box>
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: TOKENS.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Stack sx={{ alignItems: 'center' }} spacing={4}>
          {/* Logo */}
          <Box
            component="img"
            src={logo}
            alt="Ridelance"
            sx={{ height: 46, width: 'auto' }}
          />

          <Paper
            elevation={0}
            sx={{
              width: '100%',
              p: { xs: 4, sm: 6 },
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.md,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: TOKENS.primary,
              }
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: alpha(TOKENS.primary, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <AccessTimeRoundedIcon sx={{ fontSize: 32, color: TOKENS.primary }} />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.8rem' },
                color: TOKENS.ink,
                mb: 2,
                lineHeight: 1.2,
              }}
            >
              Cont activat!
            </Typography>

            <Typography
              sx={{
                color: TOKENS.textMuted,
                fontSize: '1rem',
                lineHeight: 1.6,
                mb: 5,
              }}
            >
              Abonamentul tău a fost înregistrat cu succes. Accesul la dashboard se acordă automat în fiecare{' '}
              <Box component="span" sx={{ color: TOKENS.ink, fontWeight: 700 }}>
                luni la ora 15:00
              </Box>
              .
            </Typography>

            {/* Countdown */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: { xs: 1, sm: 3 },
                mb: 5,
                p: 3,
                borderRadius: TOKENS.radius.lg,
                backgroundColor: alpha(TOKENS.primary, 0.04),
                border: `1px solid ${alpha(TOKENS.primary, 0.1)}`,
              }}
            >
              <TimeBox value={timeLeft.days} label="Zile" />
              <Typography sx={{ fontSize: '2rem', fontWeight: 300, color: alpha(TOKENS.ink, 0.2), mt: -0.5 }}>:</Typography>
              <TimeBox value={timeLeft.hours} label="Ore" />
              <Typography sx={{ fontSize: '2rem', fontWeight: 300, color: alpha(TOKENS.ink, 0.2), mt: -0.5 }}>:</Typography>
              <TimeBox value={timeLeft.minutes} label="Min" />
              <Typography sx={{ fontSize: '2rem', fontWeight: 300, color: alpha(TOKENS.ink, 0.2), mt: -0.5 }}>:</Typography>
              <TimeBox value={timeLeft.seconds} label="Sec" />
            </Box>

            <Typography sx={{ fontSize: '0.88rem', color: TOKENS.textMuted, mb: 4 }}>
              Te vom notifica prin email imediat ce contul tău devine accesibil.
            </Typography>

            <Button
              variant="outlined"
              onClick={handleLogout}
              startIcon={<LogoutRoundedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: TOKENS.textMuted,
                borderColor: TOKENS.border,
                borderRadius: TOKENS.radius.full,
                px: 4,
                py: 1.2,
                '&:hover': {
                  borderColor: TOKENS.ink,
                  color: TOKENS.ink,
                  backgroundColor: 'transparent',
                },
              }}
            >
              Deconectare
            </Button>
          </Paper>

          <Typography sx={{ fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.35), fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} RIDElance. Toate drepturile rezervate.
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
