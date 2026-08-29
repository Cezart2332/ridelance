import { Stack, Typography } from '@mui/material'

import { PanelCard, PanelHeading } from './PanelCard'
import { TOKENS } from './onboardingTheme'

/**
 * Abonamente — secțiunea există în rail, dar conținutul ei nu e definit încă.
 *
 * Ruta e montată în shell-ul de onboarding, nu doar în dashboard, ca intrarea din sidebar să
 * ducă undeva: un pas cu lacăt pe care dai click și nu se întâmplă nimic arată ca un bug.
 * Pagina repetă exact ce spune lacătul, atât — restul se scrie când se decide conținutul.
 */
export default function OnboardingSubscriptionsPage() {
  return (
    <Stack spacing={3}>
      <PanelHeading title="Abonamente" />
      <PanelCard>
        <Typography sx={{ fontSize: '0.95rem', color: TOKENS.textMuted }}>
          Secțiunea se pregătește. Îți spunem când e gata.
        </Typography>
      </PanelCard>
    </Stack>
  )
}
