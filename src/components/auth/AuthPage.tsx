import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

import logo from '../../assets/logo.svg'

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0, 0, 0, 0.06)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  textMuted: 'rgba(26, 26, 46, 0.55)',
  radius: { md: 4, lg: 6, xl: 8, full: 50 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    glow: '0 2px 8px rgba(92,203,245,0.12)',
  },
  duration: '0.2s',
  easing: 'cubic-bezier(0.4,0,0.2,1)',
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fff',
    color: TOKENS.ink,
    borderRadius: TOKENS.radius.md,
    fontWeight: 500,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(TOKENS.ink, 0.18),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.primary,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: alpha(TOKENS.ink, 0.45),
    opacity: 1,
  },
}

export default function AuthPage() {
  const [tab, setTab] = useState(0) // 0 = Login, 1 = Register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = () => {
    // Skip validation for now, just redirect to the real dashboard
    navigate('/app')
  }

  const handleRegister = () => {
    // Redirect to register PFA flow
    navigate('/inregistrare/pfa')
  }

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
              p: { xs: 3, sm: 5 },
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.md,
              backgroundColor: TOKENS.paper,
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{
                mb: 4,
                '& .MuiTabs-indicator': {
                  backgroundColor: TOKENS.primary,
                  height: 3,
                  borderRadius: 2,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: TOKENS.textMuted,
                  '&.Mui-selected': { color: TOKENS.primary },
                },
              }}
            >
              <Tab label="Autentificare" />
              <Tab label="Inregistrare" />
            </Tabs>

            {tab === 0 ? (
              /* ── LOGIN ── */
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Email
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="email@exemplu.ro"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={inputSx}
                  />
                </Box>

                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Parola
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={inputSx}
                  />
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={handleLogin}
                  sx={{
                    mt: 1,
                    py: 1.4,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: TOKENS.radius.full,
                    color: '#fff',
                    backgroundColor: TOKENS.primary,
                    boxShadow: TOKENS.shadow.glow,
                    '&:hover': {
                      backgroundColor: TOKENS.primaryStrong,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Autentificare
                </Button>

                <Typography
                  sx={{
                    textAlign: 'center',
                    color: TOKENS.textMuted,
                    fontSize: '0.88rem',
                    mt: 1,
                  }}
                >
                  Nu ai cont?{' '}
                  <Box
                    component="span"
                    sx={{ color: TOKENS.primary, fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => setTab(1)}
                  >
                    Inregistreaza-te
                  </Box>
                </Typography>
              </Stack>
            ) : (
              /* ── REGISTER ── */
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Email
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="email@exemplu.ro"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={inputSx}
                  />
                </Box>

                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Parola
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={inputSx}
                  />
                </Box>

                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Confirma parola
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={inputSx}
                  />
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={handleRegister}
                  sx={{
                    mt: 1,
                    py: 1.4,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: TOKENS.radius.full,
                    color: '#fff',
                    backgroundColor: TOKENS.primary,
                    boxShadow: TOKENS.shadow.glow,
                    '&:hover': {
                      backgroundColor: TOKENS.primaryStrong,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Inregistrare
                </Button>

                <Typography
                  sx={{
                    textAlign: 'center',
                    color: TOKENS.textMuted,
                    fontSize: '0.88rem',
                    mt: 1,
                  }}
                >
                  Ai deja cont?{' '}
                  <Box
                    component="span"
                    sx={{ color: TOKENS.primary, fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => setTab(0)}
                  >
                    Autentificare
                  </Box>
                </Typography>
              </Stack>
            )}
          </Paper>

          <Button
            onClick={() => navigate('/')}
            sx={{
              textTransform: 'none',
              color: TOKENS.textMuted,
              fontWeight: 600,
              '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' },
            }}
          >
            ← Inapoi la site
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}
