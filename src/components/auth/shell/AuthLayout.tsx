import type { ReactNode } from 'react'
import { Box, Link, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AuthBrandPanel } from './AuthBrandPanel'
import { AUTH_DENSITY, AUTH_FORM_COLUMN, AUTH_FORM_CONTENT, SHORT } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'
import logo from '../../../assets/logo.svg'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Grila de două coloane pe care stau login, register și stubul de resetare a parolei.
 *
 * `height: 100dvh` (nu `minHeight`, nu `vh`): pagina se încadrează într-un ecran, iar `dvh` ține
 * cont de bara de browser mobil. `overflowY: auto` pe coloana formularului e supapă de siguranță,
 * nu comportament așteptat — dacă se declanșează în stările normale, bugetul vertical e greșit.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useTheme()
  const showBrandPanel = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `1fr ${AUTH_FORM_COLUMN}px` },
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: TOKENS.paper,
      }}
    >
      {showBrandPanel && <AuthBrandPanel />}

      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          // `m: auto` pe copil în loc de `justifyContent: center`: dacă totuși conținutul
          // depășește ecranul, centrarea prin flex ar tăia partea de sus fără să o poți derula.
          overflowY: 'auto',
          px: { xs: 3, md: 6 },
          ...AUTH_DENSITY.formPanel,
        }}
      >
        {!showBrandPanel && (
          <Box
            sx={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: '100%',
              maxWidth: AUTH_FORM_CONTENT,
              mx: 'auto',
              mb: 3,
            }}
          >
            <Link component={RouterLink} to="/" sx={{ display: 'inline-flex' }}>
              <Box component="img" src={logo} alt="RIDElance" sx={{ height: 34, width: 'auto' }} />
            </Link>
            <Typography
              sx={{
                display: { xs: 'none', sm: 'block' },
                [SHORT]: { display: 'none' },
                fontWeight: 600,
                color: TOKENS.textMuted,
              }}
            >
              Contabilitatea ta de PFA, pe pilot automat.
            </Typography>
          </Box>
        )}

        <Box sx={{ width: '100%', maxWidth: AUTH_FORM_CONTENT, m: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  )
}
