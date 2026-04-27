import { useState, useEffect } from 'react'
import { AppBar, Box, Button, Container, Drawer, IconButton, Stack, Toolbar, Typography, useMediaQuery } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { TOKENS } from '../../constants/tokens'
import { navItems } from '../../data/constants'
import logo from '../../assets/logo.svg'

// Pages
import { HomePage } from '../../pages/HomePage'
import { FaqPage } from '../../pages/FaqPage'
import { ServicesPage } from '../../pages/ServicesPage'
import { AboutPage } from '../../pages/AboutPage'
import { CalculatorPage } from '../../pages/CalculatorPage'
import { PricingPage } from '../../pages/PricingPage'
import { PartnersPage } from '../../pages/PartnersPage'
import { ContactPage } from '../../pages/ContactPage'
import { TermsPage } from '../../pages/TermsPage'
import { PrivacyPolicyPage } from '../../pages/PrivacyPolicyPage'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const [isNavPinned, setIsNavPinned] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  useEffect(() => {
    const onScroll = () => setIsNavPinned(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (path: string) => {
    setIsMobileMenuOpen(false)
    navigate(path)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: TOKENS.ink,
        backgroundColor: TOKENS.surface,
      }}
    >
      {/* ── Navigation ── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          backgroundColor: isNavPinned
            ? alpha(TOKENS.paper, 0.95)
            : 'transparent',
          backdropFilter: isNavPinned ? 'blur(12px)' : 'none',
          borderBottom: isNavPinned
            ? `1px solid ${TOKENS.border}`
            : '1px solid transparent',
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <Container
          maxWidth="xl"
          disableGutters={!isMdUp}
          sx={{ px: { xs: 2, md: 3 } }}
        >
          <Toolbar
            disableGutters
            sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}
          >
            {/* Logo */}
            <Box
              component="button"
              onClick={() => goTo('/')}
              sx={{
                border: 'none',
                backgroundColor: 'transparent',
                p: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="Ridelance Logo"
                sx={{ height: { xs: 34, md: 50 }, width: 'auto', display: 'block' }}
              />
            </Box>

            {/* Desktop Nav */}
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                display: { xs: 'none', md: 'flex' },
                flex: 1,
                justifyContent: 'center',
                flexWrap: 'wrap',
                rowGap: 0.5,
              }}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    sx={{
                      color: isActive
                        ? TOKENS.primaryStrong
                        : alpha(TOKENS.ink, 0.8),
                      minWidth: 'auto',
                      px: 1.8,
                      py: 0.8,
                      borderRadius: TOKENS.radius.sm,
                      fontSize: '0.88rem',
                      fontWeight: 650,
                      backgroundColor: isActive
                        ? alpha(TOKENS.primary, 0.1)
                        : 'transparent',
                      '&:hover': {
                        color: TOKENS.primaryStrong,
                        backgroundColor: alpha(TOKENS.primary, 0.08),
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Stack>

            {/* Desktop CTA */}
            <Button
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => goTo('/demo')}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                px: 3,
                py: 1,
                color: '#fff',
                backgroundColor: TOKENS.primary,
                borderRadius: TOKENS.radius.full,
                fontWeight: 700,
                boxShadow: TOKENS.shadow.glow,
                '&:hover': {
                  backgroundColor: TOKENS.primaryStrong,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Demo
            </Button>

            {/* Mobile Controls */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                ml: 'auto',
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
              }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={() => goTo('/demo')}
                sx={{
                  px: 2,
                  py: 0.6,
                  minWidth: 'unset',
                  color: '#fff',
                  backgroundColor: TOKENS.primary,
                  borderRadius: TOKENS.radius.full,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                Dashboard
              </Button>
              <IconButton
                size="small"
                aria-label="Deschide meniul"
                onClick={() => setIsMobileMenuOpen(true)}
                sx={{
                  border: `1px solid ${TOKENS.border}`,
                  color: TOKENS.primaryStrong,
                  backgroundColor: alpha(TOKENS.paper, 0.8),
                }}
              >
                <MenuRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="right"
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '85vw', sm: 340 },
              p: 3,
              backgroundColor: TOKENS.paper,
            },
          },
        }}
      >
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Box
              component="img"
              src={logo}
              alt="Ridelance Logo"
              sx={{ height: 38, width: 'auto', display: 'block' }}
            />
            <IconButton
              aria-label="Inchide meniul"
              onClick={() => setIsMobileMenuOpen(false)}
              sx={{ color: TOKENS.ink }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {navItems.map((item) => (
              <Button
                key={`mobile-${item.path}`}
                onClick={() => goTo(item.path)}
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.5,
                  py: 1,
                  borderRadius: TOKENS.radius.md,
                  color:
                    location.pathname === item.path
                      ? TOKENS.primaryStrong
                      : alpha(TOKENS.ink, 0.85),
                  backgroundColor:
                    location.pathname === item.path
                      ? alpha(TOKENS.primary, 0.1)
                      : 'transparent',
                  fontWeight: 650,
                  fontSize: '0.95rem',
                  '&:hover': {
                    backgroundColor: alpha(TOKENS.primary, 0.06),
                    color: TOKENS.primaryStrong,
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          <Button
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => goTo('/demo')}
            sx={{
              mt: 'auto',
              color: '#fff',
              backgroundColor: TOKENS.primary,
              borderRadius: TOKENS.radius.full,
              py: 1.2,
              fontWeight: 700,
              boxShadow: TOKENS.shadow.glow,
            }}
          >
            Dashboard
          </Button>
        </Stack>
      </Drawer>

      {/* ── Main Content ── */}
      <Box component="main" sx={{ flex: 1, position: 'relative' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/intrebari-frecvente" element={<FaqPage />} />
          <Route path="/servicii" element={<ServicesPage />} />
          <Route path="/despre-ridelance" element={<AboutPage />} />
          <Route path="/fiscal" element={<CalculatorPage />} />
          <Route path="/calculator-taxe" element={<Navigate to="/fiscal" replace />} />
          <Route path="/abonamente-preturi" element={<PricingPage />} />
          <Route path="/parteneri" element={<PartnersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={<Navigate to="/demo" replace />} />
          <Route
            path="/dashboard-demo"
            element={<Navigate to="/demo" replace />}
          />
          <Route path="/termeni-si-conditii" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* ── Footer ── */}
      <Box
        component="footer"
        sx={{
          py: { xs: 6, md: 8 },
          backgroundColor: TOKENS.ink,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 3, md: 4 },
              pb: 3,
              borderBottom: `1px solid ${alpha('#fff', 0.15)}`,
            }}
          >
            <Stack spacing={1.2} sx={{ alignItems: 'flex-start' }}>
              <Box
                component="a"
                href="mailto:contact@ridelance.ro"
                sx={{
                  color: alpha('#fff', 0.9),
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  '&:hover': { color: '#fff' },
                }}
              >
                contact@ridelance.ro
              </Box>
              <Box
                component="a"
                href="tel:+40070000000"
                sx={{
                  color: alpha('#fff', 0.9),
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  '&:hover': { color: '#fff' },
                }}
              >
                +40 700 000 000
              </Box>
            </Stack>

            <Stack
              spacing={1.2}
              sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}
            >
              <Button
                onClick={() => goTo('/termeni-si-conditii')}
                sx={{
                  p: 0,
                  minWidth: 'unset',
                  color: alpha('#fff', 0.9),
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  '&:hover': { color: '#fff', backgroundColor: 'transparent' },
                }}
              >
                Termeni si conditii
              </Button>
              <Button
                onClick={() => goTo('/privacy-policy')}
                sx={{
                  p: 0,
                  minWidth: 'unset',
                  color: alpha('#fff', 0.9),
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  '&:hover': { color: '#fff', backgroundColor: 'transparent' },
                }}
              >
                Privacy Policy
              </Button>
            </Stack>
          </Box>

          <Typography
            sx={{
              pt: 3,
              textAlign: 'center',
              color: alpha('#fff', 0.7),
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            © Copyright 2026 by ridelance.ro
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
