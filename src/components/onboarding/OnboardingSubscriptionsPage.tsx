import { Stack, Typography } from '@mui/material'

import { PanelCard, PanelHeading } from './PanelCard'
import { TOKENS } from './onboardingTheme'

/**
 * Abonamente — o secțiune a shell-ului de onboarding, nu un pas al lui.
 *
 * Se ajunge aici din blocul de suport din sidebar, fiindcă nu e o etapă a înrolării: nu se
 * completează, nu se validează și nu deblochează nimic. Conținutul se definește separat; până
 * atunci pagina spune atât — o secțiune goală e mai onestă decât una inventată.
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
