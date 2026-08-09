import { Box, Button, Stack, Typography } from '@mui/material'

import type { EligibilityProfile } from '../../../services/onboarding.service'
import { TOKENS } from '../onboardingTheme'
import { OnboardingCard } from './OnboardingCard'

interface BlockedStateCardProps {
  eyebrow: string
  eligibility: EligibilityProfile
  onContactSupport: () => void
  /** Întoarcere la ecranul anterior: condiția se poate schimba, deci nu e o fundătură. */
  onBack: () => void
}

/** Atestatul e singura condiție pe care userul o poate rezolva singur, imediat. */
const ATTESTATION_HINT = 'atestat'

/**
 * Ecranul de blocaj. Nu e o fundătură: spune exact ce condiție nu e îndeplinită, ce se poate face
 * mai departe, și lasă rail-ul întreg — utilizatorul se poate întoarce și poate încărca alt
 * document.
 *
 * Motivele vin de la server (`EligibilityRules.cs`), nu din frontend. Aici nu se decide nimic.
 */
export function BlockedStateCard({
  eyebrow,
  eligibility,
  onContactSupport,
  onBack,
}: BlockedStateCardProps) {
  const missingAttestation = eligibility.reasons.some((r) => r.toLowerCase().includes(ATTESTATION_HINT))

  return (
    <OnboardingCard
      eyebrow={eyebrow}
      icon="shield"
      tone="danger"
      title="Momentan nu îndeplinești condițiile de eligibilitate"
      footer={
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onBack} sx={{ color: TOKENS.textMuted }}>
            Înapoi la pasul anterior
          </Button>
          <Button variant="contained" onClick={onContactSupport}>
            Suport
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <Box
          component="ul"
          aria-label="Condiții neîndeplinite"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'grid',
            gap: 1.25,
          }}
        >
          {eligibility.reasons.map((reason) => (
            <Box
              key={reason}
              component="li"
              sx={{
                borderLeft: `3px solid ${TOKENS.dangerBase}`,
                pl: 2,
                py: 0.5,
              }}
            >
              <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 500 }}>
                {reason}
              </Typography>
            </Box>
          ))}
        </Box>

        {missingAttestation && (
          <Box
            sx={{
              p: 2,
              borderRadius: `${TOKENS.radius.lg}px`,
              backgroundColor: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
            }}
          >
            <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 600, mb: 1 }}>
              Atestatul se eliberează de Autoritatea Rutieră Română.
            </Typography>
            <Button
              size="small"
              href="https://www.arr.ro"
              target="_blank"
              rel="noopener"
              sx={{ px: 0, fontWeight: 700 }}
            >
              Deschide site-ul ARR
            </Button>
          </Box>
        )}
      </Stack>
    </OnboardingCard>
  )
}
