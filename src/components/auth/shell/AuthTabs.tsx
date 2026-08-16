import { Box, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { DENSE } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'
import { ROUTES } from '../../../constants/routes'

const TABS = [
  { key: 'login', label: 'Autentificare', to: ROUTES.login },
  { key: 'register', label: 'Creează cont', to: ROUTES.register },
] as const

interface AuthTabsProps {
  active: (typeof TABS)[number]['key']
}

/**
 * Segmented control-ul din mockup, dar peste rute reale: fiecare „tab" e un link către
 * `/autentificare` sau `/inregistrare`, nu o schimbare de state. Arată la fel, iar deep-link-ul,
 * butonul de back al browserului și ruta separată de CarPoster continuă să funcționeze.
 *
 * Semantic sunt link-uri, nu `role="tab"` — un tablist care schimbă URL-ul mințindu-l pe cititorul
 * de ecran e mai rău decât o navigație declarată ca atare.
 */
export function AuthTabs({ active }: AuthTabsProps) {
  return (
    <Box
      component="nav"
      aria-label="Autentificare sau cont nou"
      sx={{
        display: 'flex',
        gap: 0.5,
        p: 0.5,
        mb: 3,
        backgroundColor: TOKENS.surfaceAlt,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: `${TOKENS.radius.lg}px`,
        [DENSE]: { mb: 2 },
      }}
    >
      {TABS.map((tab) => {
        const selected = tab.key === active
        return (
          <Link
            key={tab.key}
            component={RouterLink}
            to={tab.to}
            underline="none"
            aria-current={selected ? 'page' : undefined}
            sx={{
              flex: 1,
              minHeight: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: `${TOKENS.radius.md}px`,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: selected ? TOKENS.primaryStrong : TOKENS.textMuted,
              backgroundColor: selected ? TOKENS.paper : 'transparent',
              boxShadow: selected ? TOKENS.shadow.sm : 'none',
              transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': { color: selected ? TOKENS.primaryStrong : TOKENS.ink },
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </Box>
  )
}
