import { Alert, Box } from '@mui/material'
import { Suspense, lazy } from 'react'

import { TOKENS } from '../onboardingTheme'
import { useOnboarding } from '../useOnboarding'

/**
 * Punctul unic de intrare al uneltelor de dezvoltare (spec fix-uri §13.1, nivelul 1).
 *
 * `DEVTOOLS_ENABLED` e o constantă de build: `import.meta.env` se înlocuiește literal la
 * compilare, deci în producție condiția devine `false &&`, `lazy(...)` nu se mai evaluează,
 * iar bundlerul scoate cu totul chunk-ul panoului. Verifică în bundle-ul final că
 * `OnboardingDevPanel` nu apare.
 *
 * Nivelurile 2 și 3 (feature flag + allowlist) sunt pe server și decid `state.devToolsEnabled`.
 * Chiar dacă cineva ar rula un build cu flagul pornit, endpoint-urile răspund 404.
 */
const DEVTOOLS_ENABLED = import.meta.env.VITE_ONBOARDING_DEVTOOLS === 'true'

const DevPanel = DEVTOOLS_ENABLED
  ? lazy(() => import('./OnboardingDevPanel'))
  : null

export function OnboardingDevTools() {
  const { state } = useOnboarding()

  // Bannerul e legat de starea dosarului, nu de panou: o sesiune atinsă de unelte rămâne în
  // sandbox și după ce panoul e închis, iar asta trebuie să se vadă tot timpul (§13.6).
  const banner = state?.isDevSession ? (
    <Alert
      severity="warning"
      role="status"
      square
      sx={{
        borderRadius: 0,
        fontWeight: 700,
        justifyContent: 'center',
        color: TOKENS.pending,
      }}
    >
      MOD DEV — date de test, integrările externe sunt simulate
    </Alert>
  ) : null

  if (!DEVTOOLS_ENABLED || DevPanel === null) {
    return banner
  }

  return (
    <Box>
      {banner}
      <Suspense fallback={null}>
        <DevPanel />
      </Suspense>
    </Box>
  )
}
