import { Box, Link, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { SUPPORT_EMAIL } from '../dialogs/SupportEmailDialog'
import { displaySx } from '../onboardingTheme'
import { SHELL } from '../shellTokens'
import { useOnboardingSupport } from '../supportContext'
import { REVIEW_ETA, REVIEW_HOURS, type ReviewMode } from './reviewModel'

/**
 * Rail-ul din dreapta cât pasul e la noi: cât durează și când lucrăm. Înlocuiește lista „Ce ai de
 * făcut aici", care pe un pas predat nu mai are ce cere.
 */
export function ReviewRail({ mode }: { mode: ReviewMode }) {
  const support = useOnboardingSupport()

  return (
    <Stack spacing={2}>
      {mode === 'pending' && (
        <Card label="Durata verificării">
          <Typography sx={{ ...displaySx, fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: SHELL.text.primary }}>
            {REVIEW_ETA}
          </Typography>
        </Card>
      )}

      <Card label="Program onboarding">
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: SHELL.text.primary }}>{REVIEW_HOURS.days}</Typography>
        <Typography sx={{ ...SHELL.tabular, ...displaySx, fontSize: 20, fontWeight: 700, lineHeight: 1.3, color: SHELL.text.primary }}>
          {REVIEW_HOURS.time}
        </Typography>
        {/* Dialogul de email pune pasul și numărul dosarului în mesaj. Pe telefon adresa e deja în
            subsolul paginii, deci aici ar fi apărut a doua oară. */}
        <Link
          component="button"
          type="button"
          onClick={support.openEmail}
          underline="hover"
          sx={{ display: { xs: 'none', md: 'inline-block' }, mt: 1.5, fontSize: 13, fontWeight: 600, color: SHELL.brand }}
        >
          {SUPPORT_EMAIL}
        </Link>
      </Card>
    </Stack>
  )
}

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: `${SHELL.radius.card}px`,
        border: `1px solid ${SHELL.border.subtle}`,
        backgroundColor: SHELL.bg.surface,
        boxShadow: SHELL.shadow.card,
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: SHELL.text.secondary, mb: 0.75 }}>{label}</Typography>
      {children}
    </Box>
  )
}
