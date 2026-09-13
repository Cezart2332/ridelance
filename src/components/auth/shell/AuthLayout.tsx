import type { ReactNode } from 'react'
import { Box, Link, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import { AuthSlider } from './AuthSlider'
import { AUTH_COLORS, AUTH_FORM_CONTENT } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'
import logoWithMotto from '../../../assets/logowithmotto.svg'

interface AuthLayoutProps {
  children: ReactNode
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
export function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useTheme()
  const showSlider = useMediaQuery(theme.breakpoints.up('md'))

  return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          color: AUTH_COLORS.text,
          backgroundColor: AUTH_COLORS.page,
          backgroundImage: `radial-gradient(900px 520px at 50% 0%, ${alpha(TOKENS.primary, 0.22)} 0%, transparent 70%)`,
        }}
      >
        <Link component={RouterLink} to="/" aria-label="RIDElance — pagina principală" sx={{ display: 'inline-flex' }}>
          <Box
            component="img"
            src={logoWithMotto}
            alt="RIDElance — Independent. Dar nu singur."
            sx={{ width: { xs: 190, md: 240 }, height: 'auto', display: 'block' }}
          />
        </Link>

        {/* `my: auto` în loc de centrare prin flex: dacă formularul e mai înalt decât ecranul,
            centrarea ar tăia partea de sus fără să o poți derula. */}
        <Box sx={{ width: '100%', maxWidth: 1120, my: 'auto', pt: { xs: 3, md: 4 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { md: 1 },
              p: { xs: 0, md: 1.5 },
              borderRadius: { xs: `${TOKENS.radius.xl}px`, md: '24px' },
              backgroundColor: AUTH_COLORS.card,
              border: `1px solid ${AUTH_COLORS.border}`,
              boxShadow: '0 30px 80px rgba(69, 184, 226, 0.16), 0 2px 8px rgba(26, 26, 46, 0.04)',
            }}
          >
            {showSlider && <AuthSlider />}

            <Box
              component="main"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 2.5, sm: 4, md: 5, lg: 7 },
                py: { xs: 4, md: 5 },
              }}
            >
              <Box sx={{ width: '100%', maxWidth: AUTH_FORM_CONTENT }}>{children}</Box>
            </Box>
          </Box>

          {!showSlider && (
            <Box sx={{ mt: 2.5, textAlign: 'center' }}>
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
