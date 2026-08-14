import { Stack, Typography } from '@mui/material'

import type { MicroStepContext, MicroStepDef } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'

/**
 * Ecran read-only: ce urmează, cât costă, ce așteptăm de la noi.
 *
 * Primește doar linii de text, niciodată markup. Un ecran de onboarding care ar avea nevoie de
 * markup bogat nu e un ecran de onboarding — e o pagină, și își are locul în altă parte.
 */
export function MicroInfoStep({ def, context }: { def: MicroStepDef; context: MicroStepContext }) {
  const lines = def.lines?.(context) ?? []

  return (
    <Stack spacing={1.25}>
      {lines.map((line) => (
        <Typography key={line} sx={{ fontSize: '0.95rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>
          {line}
        </Typography>
      ))}
    </Stack>
  )
}
