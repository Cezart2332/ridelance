import type { ReactNode } from 'react'
import { Box, Link, useMediaQuery, useTheme } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AuthBrandPanel } from './AuthBrandPanel'
import { AUTH_DENSITY, AUTH_FORM_CONTENT, DENSE } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'
import logo from '../../../assets/logo.svg'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Grila din mockup — `minmax(0,58%) minmax(420px,42%)` — pe care stau login, register și stubul
 * de resetare a parolei.
 *
 * `height: 100dvh` (nu `minHeight`, nu `vh`): pagina se încadrează într-un ecran, iar `dvh` ține
 * cont de bara de browser mobil. `overflowY: auto` pe coloana formularului e supapă de siguranță,
 * nu comportament așteptat — panoul stâng își lasă blocurile secundare pe măsură ce ecranul scade.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useTheme()
  // Nu doar `display: none`: sub `md` panoul nu se montează deloc, altfel browserul ar descărca
  // captura de produs degeaba.
  const showBrandPanel = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 58%) minmax(420px, 42%)' },
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: TOKENS.paper,
      }}
    >
      {showBrandPanel && <AuthBrandPanel />}

      <Box
        component="main"
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          // `m: auto` pe copil în loc de `justifyContent: center`: dacă totuși conținutul
          // depășește ecranul, centrarea prin flex ar tăia partea de sus fără să o poți derula.
          overflowY: 'auto',
          px: { xs: 3, md: 5 },
          ...AUTH_DENSITY.formPanel,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: AUTH_FORM_CONTENT, m: 'auto' }}>
          {!showBrandPanel && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Link component={RouterLink} to="/" sx={{ display: 'inline-flex' }}>
                <Box component="img" src={logo} alt="RIDElance" sx={{ height: 34, width: 'auto' }} />
              </Link>
            </Box>
          )}

          {children}

          {/*
            Pe telefoanele scunde cade primul: logo-ul de deasupra formularului duce deja acasă,
            deci e singurul element de aici care nu pierde nimic dacă dispare.
          */}
          <Box
            sx={{
              display: { md: 'none' },
              mt: 2,
              textAlign: 'center',
              '@media (max-height:700px)': { display: 'none' },
            }}
          >
            <Link component={RouterLink} to="/" underline="hover" variant="caption" sx={{ color: TOKENS.textSubtle }}>
              ← Înapoi la site
            </Link>
          </Box>
        </Box>

        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          variant="caption"
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            right: 24,
            bottom: 20,
            color: TOKENS.textSubtle,
            [DENSE]: { bottom: 12 },
          }}
        >
          ← Înapoi la site
        </Link>
      </Box>
    </Box>
  )
}
