import { lazy, Suspense, useState, useEffect } from 'react'
import { AppBar, Box, Button, Container, Drawer, IconButton, Stack, Toolbar, Typography, useMediaQuery, Avatar } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import { TOKENS } from '../../constants/tokens'
import { navItems } from '../../data/constants'
import logo from '../../assets/logo.svg'
import { useAppSelector } from '../../store/hooks'

import { RouteFallback } from '../common/RouteFallback'
import { ServicePaymentSuccessDialog } from '../services/ServicePaymentSuccessDialog'

const HomePage = lazy(() => import('../../pages/HomePage').then((m) => ({ default: m.HomePage })))
const FaqPage = lazy(() => import('../../pages/FaqPage').then((m) => ({ default: m.FaqPage })))
const ServicesPage = lazy(() => import('../../pages/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const AboutPage = lazy(() => import('../../pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const CalculatorPage = lazy(() => import('../../pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage })))
const PricingPage = lazy(() => import('../../pages/PricingPage').then((m) => ({ default: m.PricingPage })))
const PartnersPage = lazy(() => import('../../pages/PartnersPage').then((m) => ({ default: m.PartnersPage })))
const ContactPage = lazy(() => import('../../pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const TermsPage = lazy(() => import('../../pages/TermsPage').then((m) => ({ default: m.TermsPage })))
const PrivacyPolicyPage = lazy(() =>
  import('../../pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
)
const CarsPage = lazy(() => import('../../pages/CarsPage').then((m) => ({ default: m.CarsPage })))

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const [isNavPinned, setIsNavPinned] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const { accessToken } = useAppSelector((s) => s.auth)

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
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(TOKENS.ink, 0.04)}`,
          boxShadow: isNavPinned ? '0 8px 30px rgba(0,0,0,0.02)' : 'none',
          transition: `all 0.3s ${TOKENS.easing}`,
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
                        ? TOKENS.ink
                        : alpha(TOKENS.ink, 0.65),
                      minWidth: 'auto',
                      px: 2,
                      py: 1,
                      position: 'relative',
                      borderRadius: TOKENS.radius.sm,
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '0.01em',
                      backgroundColor: 'transparent',
                      transition: `all 0.2s ease`,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 6,
                        left: '20%',
                        right: '20%',
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: TOKENS.primaryStrong,
                        transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                      },
                      '&:hover': {
                        color: TOKENS.ink,
                        backgroundColor: alpha(TOKENS.ink, 0.03),
                        '&::after': {
                          transform: 'scaleX(1)',
                        }
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Stack>

            {/* Desktop CTA */}
            {!accessToken ? (
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
                  borderRadius: TOKENS.radius.md,
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Demo
              </Button>
            ) : (
              <IconButton
                onClick={() => goTo('/app')}
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  p: 0,
                  border: `2px solid ${alpha(TOKENS.primary, 0.25)}`,
                  '&:hover': {
                    borderColor: TOKENS.primary,
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: TOKENS.primary,
                    color: '#fff',
                    width: 40,
                    height: 40,
                  }}
                >
                  <PersonRoundedIcon />
                </Avatar>
              </IconButton>
            )}

            {/* Mobile Controls */}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                ml: 'auto',
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
              }}
            >
              {!accessToken ? (
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
                    borderRadius: TOKENS.radius.md,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  Dashboard
                </Button>
              ) : (
                <IconButton
                  onClick={() => goTo('/app')}
                  sx={{
                    p: 0,
                    border: `2px solid ${alpha(TOKENS.primary, 0.25)}`,
                    '&:hover': {
                      borderColor: TOKENS.primary,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: TOKENS.primary,
                      color: '#fff',
                      width: 32,
                      height: 32,
                    }}
                  >
                    <PersonRoundedIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                </IconButton>
              )}
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
            {accessToken && (
              <Button
                onClick={() => goTo('/app')}
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.5,
                  py: 1,
                  borderRadius: TOKENS.radius.md,
                  color: TOKENS.primaryStrong,
                  fontWeight: 750,
                  fontSize: '0.95rem',
                  backgroundColor: alpha(TOKENS.primary, 0.05),
                  '&:hover': {
                    backgroundColor: alpha(TOKENS.primary, 0.1),
                  },
                }}
              >
                Profilul meu
              </Button>
            )}
          </Stack>

          <Button
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => goTo(accessToken ? '/app' : '/demo')}
            sx={{
              mt: 'auto',
              color: '#fff',
              backgroundColor: TOKENS.primary,
              borderRadius: TOKENS.radius.md,
              py: 1.2,
              fontWeight: 700,
              boxShadow: 'none',
            }}
          >
            {accessToken ? 'Profilul meu' : 'Dashboard'}
          </Button>
        </Stack>
      </Drawer>

      <ServicePaymentSuccessDialog />

      {/* ── Main Content ── */}
      <Box component="main" sx={{ flex: 1, position: 'relative' }}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/masini" element={<CarsPage />} />
            <Route path="/intrebari-frecvente" element={<FaqPage />} />
            <Route path="/servicii" element={<ServicesPage />} />
            <Route path="/despre-ridelance" element={<AboutPage />} />
            <Route path="/fiscal" element={<CalculatorPage />} />
            <Route path="/calculator-taxe" element={<Navigate to="/fiscal" replace />} />
            <Route path="/abonamente-preturi" element={<PricingPage />} />
            <Route path="/parteneri" element={<PartnersPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/dashboard" element={<Navigate to="/demo" replace />} />
            <Route path="/dashboard-demo" element={<Navigate to="/demo" replace />} />
            <Route path="/termeni-si-conditii" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Box>

      {/* ── Footer ── */}
      <Box
        component="footer"
        sx={{
          py: { xs: 6, md: 8 },
          background: `radial-gradient(circle at 50% -20%, #21283c 0%, #10101d 100%)`,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          borderTop: `1px solid ${alpha('#fff', 0.08)}`,
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
