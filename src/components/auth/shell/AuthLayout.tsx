import type { ReactNode } from 'react'
import { Box, Link, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import { AuthSlider } from './AuthSlider'
import { AUTH_COLORS, AUTH_FORM_CONTENT } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'
import logoWithMotto from '../../../assets/logowithmotto.svg'
import { IS_NATIVE_APP } from '../../../native/platform'
import { NativeAuthLayout } from '../../../native/launch/NativeAuthLayout'

interface AuthLayoutProps {
  children: ReactNode
  /** Rezervă același spațiu pentru login și înregistrare, inclusiv pe mobil. */
  accountForm?: boolean
}

/**
 * Cadrul comun pentru autentificare, cont nou, confirmare și resetarea parolei.
 *
 * Logoul stă deasupra, pe mijloc, ca un titlu. Dedesubt, un card centrat — nu pe toată pagina, cu
 * aer în jur — împărțit în două: slide-urile în stânga, formularul în dreapta. Sub `md` rămâne
 * doar formularul; slide-urile nu se montează deloc, ca imaginile să nu se descarce pe telefon.
 *
 * Folosește tema deschisă a aplicației: alb, cu albastrul platformei ca accent.
 */
export function AuthLayout({ children, accountForm = false }: AuthLayoutProps) {
  const theme = useTheme()
  const showSlider = useMediaQuery(theme.breakpoints.up('md'))

  // Aplicația mobilă are cadrul ei: antetul curbat în care se strânge cortina de la pornire.
  if (IS_NATIVE_APP) return <NativeAuthLayout>{children}</NativeAuthLayout>

  return (
      <Box
        sx={{
          minHeight: '100dvh',
          ...(accountForm && {
            '--auth-header-gap': '16px',
            '--auth-field-gap': '10px',
            '--auth-meta-gap': '12px',
            '--auth-action-gap': '16px',
            '--auth-footer-gap': '12px',
            '--auth-footer-padding': '8px',
            '--auth-input-padding': '10px',
            '--auth-button-height': '44px',
            '--auth-title-size': '28px',
            '--auth-subtitle-gap': '8px',
            '--auth-slider-min-height': '0px',
            '@media (max-height: 700px)': {
              '--auth-header-gap': '12px',
              '--auth-field-gap': '8px',
              '--auth-meta-gap': '8px',
              '--auth-action-gap': '12px',
              '--auth-title-size': '24px',
              '--auth-subtitle-gap': '4px',
              '--auth-form-padding': '8px',
            },
            '@media (max-height: 650px)': {
              '--auth-header-gap': '8px',
              '--auth-field-gap': '6px',
              '--auth-form-padding': '4px',
              '--auth-trust-display': 'none',
            },
          }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          py: accountForm ? { xs: 1, md: 2 } : { xs: 3, md: 4 },
          color: AUTH_COLORS.text,
          backgroundColor: AUTH_COLORS.page,
          backgroundImage: `radial-gradient(900px 520px at 50% 0%, ${alpha(TOKENS.primary, 0.22)} 0%, transparent 70%)`,
        }}
      >
        <Link component={RouterLink} to={IS_NATIVE_APP ? '/app' : '/'} aria-label="RIDElance — pagina principală" sx={{ display: 'inline-flex' }}>
          <Box
            component="img"
            src={logoWithMotto}
            alt="RIDElance — Independent. Dar nu singur."
            sx={{ width: accountForm ? { xs: 120, md: 160 } : { xs: 190, md: 240 }, height: 'auto', display: 'block' }}
          />
        </Link>

        {/* `my: auto` în loc de centrare prin flex: dacă formularul e mai înalt decât ecranul,
            centrarea ar tăia partea de sus fără să o poți derula. */}
        <Box sx={{ width: '100%', maxWidth: accountForm ? 1000 : 1120, my: 'auto', pt: accountForm ? 1.5 : { xs: 3, md: 4 } }}>
          <Box
            sx={{
              display: 'grid',
              minHeight: accountForm ? { xs: 'min(584px, calc(100svh - 112px))', sm: 'min(540px, calc(100svh - 112px))' } : undefined,
              gridTemplateColumns: { xs: '1fr', md: IS_NATIVE_APP ? '1fr' : '1fr 1fr' },
              gap: { md: 1 },
              p: { xs: 0, md: 1.5 },
              borderRadius: { xs: `${TOKENS.radius.xl}px`, md: '24px' },
              backgroundColor: AUTH_COLORS.card,
              border: `1px solid ${AUTH_COLORS.border}`,
              boxShadow: '0 30px 80px rgba(69, 184, 226, 0.16), 0 2px 8px rgba(26, 26, 46, 0.04)',
            }}
          >
            {showSlider && !IS_NATIVE_APP && <AuthSlider />}

            <Box
              component="main"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: accountForm ? { xs: 2, sm: 3, md: 4 } : { xs: 2.5, sm: 4, md: 5, lg: 7 },
                py: accountForm ? { xs: 'var(--auth-form-padding, 12px)', sm: 'var(--auth-form-padding, 16px)' } : { xs: 4, md: 5 },
              }}
            >
              <Box sx={{ width: '100%', maxWidth: AUTH_FORM_CONTENT }}>{children}</Box>
            </Box>
          </Box>

          {/* În aplicația mobilă nu există site spre care să te întorci. */}
          {!showSlider && !IS_NATIVE_APP && (
            <Box sx={{ mt: accountForm ? 1 : 2.5, textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/"
                underline="hover"
                variant="body2"
                sx={{ color: AUTH_COLORS.textMuted }}
              >
                ← Înapoi la site
              </Link>
            </Box>
          )}
        </Box>
      </Box>
  )
}
