import { useEffect } from 'react'
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'

import logo from '../../assets/logo.svg'

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0, 0, 0, 0.06)',
  textMuted: 'rgba(26, 26, 46, 0.55)',
  radius: { md: 4, lg: 6, xl: 8, full: 50 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    glow: '0 2px 8px rgba(92,203,245,0.12)',
  },
}

export default function RegistrationSuccessPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/app')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.surface,
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
            sx={{ height: 50, width: 'auto', cursor: 'pointer' }}
            onClick={() => navigate('/')}
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
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: alpha(TOKENS.primary, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircleOutlineRoundedIcon
                sx={{ fontSize: 40, color: TOKENS.primary }}
              />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.5rem',
                color: TOKENS.ink,
                mb: 2,
              }}
            >
              Procedura finalizata cu succes!
            </Typography>

            <Typography
              sx={{
                color: TOKENS.textMuted,
                fontSize: '1.02rem',
                lineHeight: 1.7,
                maxWidth: 420,
                mx: 'auto',
              }}
            >
              Veti fi contactat pe adresa de email/whatsapp de catre{' '}
              <Box component="span" sx={{ fontWeight: 700, color: TOKENS.ink }}>
                Silso
              </Box>
              , pentru semnare electronica si olograf a documentatiei si verificare.
            </Typography>
          </Paper>

          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              px: 4,
              py: 1.2,
              fontWeight: 700,
              borderRadius: TOKENS.radius.full,
              color: '#fff',
              backgroundColor: TOKENS.primary,
              boxShadow: TOKENS.shadow.glow,
              '&:hover': {
                backgroundColor: TOKENS.primaryStrong,
              },
            }}
          >
            Inapoi la pagina principala
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}
