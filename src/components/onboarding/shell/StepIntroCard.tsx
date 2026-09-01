import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { STEP_INTRO } from '../config/stepIntro'
import { displaySx, TOKENS } from '../onboardingTheme'

/**
 * Antetul pasului, deasupra cardului cu întrebări.
 *
 * Cardul de dedesubt arată o singură întrebare — bun pentru concentrare, dar lăsa ecranul gol și
 * fără reper: la ce pas ești, cât ține, ce ți se cere în mare. Aici stau exact astea trei, o
 * singură dată, iar cardul de jos rămâne cu treaba lui.
 *
 * Nu repetă întrebarea curentă. Dacă ar face-o, ar fi al doilea titlu pe ecran și n-ar mai fi clar
 * care dintre ele e de citit.
 */

interface StepIntroCardProps {
  /** Cheia pasului mare: `eligibility`, `pfa`, … Fără o intrare în `STEP_INTRO`, nu se randează. */
  stepKey: string | null
  /** Numărul pasului, așa cum îl numără rail-ul. */
  position: number
  total: number
  /** Eticheta pasului, de la server — aceeași care apare în rail și în bara de sus. */
  label: string | null
  /** Estimarea de completare, dacă mai e ceva de completat. Vine din `stepEstimate`. */
  estimate: string | null
}

export function StepIntroCard({ stepKey, position, total, label, estimate }: StepIntroCardProps) {
  const intro = stepKey ? STEP_INTRO[stepKey] : undefined
  if (!intro) return null

  // Durata stă prima: e întrebarea pe care și-o pune oricine deschide un pas nou.
  const chips = [...(estimate ? [estimate] : []), ...intro.tags]

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 720,
        mx: 'auto',
        mb: { xs: 2, md: 2.5 },
        p: { xs: 2.5, sm: 3.5, md: 4 },
        borderRadius: `${TOKENS.radius.xl}px`,
        border: `1px solid ${TOKENS.border}`,
        // Un strop de accent în fundal, ca antetul să nu pară un al doilea card de conținut.
        background: `linear-gradient(135deg, ${alpha(TOKENS.primary, 0.07)} 0%, ${TOKENS.paper} 62%)`,
      }}
    >
      <Typography
        variant="overline"
        component="p"
        sx={{ color: TOKENS.primaryStrong, mb: 0.8, lineHeight: 1.4 }}
      >
        Pasul {position} din {total}
        {label ? ` · ${label}` : null}
      </Typography>

      <Typography
        component="p"
        sx={{
          ...displaySx,
          fontWeight: 800,
          fontSize: { xs: '1.7rem', sm: '2.1rem', md: '2.4rem' },
          lineHeight: 1.1,
          color: TOKENS.ink,
        }}
      >
        {intro.lead}{' '}
        <Box component="span" sx={{ color: TOKENS.primaryStrong }}>
          {intro.accent}
        </Box>
      </Typography>

      <Typography sx={{ mt: 1, fontSize: '0.92rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>
        {intro.subtitle}
      </Typography>

      {chips.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
          {chips.map((chip) => (
            <Box
              key={chip}
              sx={{
                px: 1.4,
                py: 0.5,
                borderRadius: `${TOKENS.radius.full}px`,
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: TOKENS.paper,
                fontSize: '0.74rem',
                fontWeight: 750,
                color: TOKENS.textMuted,
                whiteSpace: 'nowrap',
              }}
            >
              {chip}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
