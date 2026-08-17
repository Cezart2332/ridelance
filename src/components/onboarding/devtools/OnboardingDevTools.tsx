import { Alert, Box } from '@mui/material'

import { TOKENS } from '../onboardingTheme'
import { useOnboarding } from '../useOnboarding'
import OnboardingDevPanel from './OnboardingDevPanel'

/**
 * Punctul unic de intrare al uneltelor de dezvoltare.
 *
 * Fără flag de build: panoul se randează ori de câte ori serverul spune `devToolsEnabled`.
 * Decizia stă într-un singur loc — `OnboardingDevToolsGate` — pentru că oricum el e cel care
 * gardează endpoint-urile. Un al doilea comutator, în bundler, ar fi însemnat două lucruri de
 * pornit ca să funcționeze unul.
 *
 * Bannerul e legat de starea dosarului, nu de panou: o sesiune atinsă de unelte rămâne în
 * sandbox și după ce panoul e închis, iar asta trebuie să se vadă tot timpul.
 */
export function OnboardingDevTools() {
  const { state } = useOnboarding()

  return (
    <Box>
      {state?.isDevSession && (
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
      )}

      <OnboardingDevPanel />
    </Box>
  )
}
