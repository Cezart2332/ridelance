import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { displaySx, TOKENS } from '../onboardingTheme'
import type { MicroStepIcon } from '../microStepTypes'
import { ICON_MAP } from './microStepIcons'

interface OnboardingCardProps {
  eyebrow: string
  icon: MicroStepIcon
  title: string
  /** Tonul iconiței: `danger` pentru ecranul de blocaj, `success` pentru rezumatul închis. */
  tone?: 'accent' | 'danger' | 'success'
  children: ReactNode
  footer?: ReactNode
}

const TONE = {
  accent: { fg: TOKENS.primaryStrong, bg: TOKENS.primarySoft },
  danger: { fg: TOKENS.danger, bg: 'rgba(211, 47, 47, 0.08)' },
  success: { fg: TOKENS.success, bg: 'rgba(46, 125, 50, 0.08)' },
} as const

/**
 * Cardul central. Un singur lucru pe ecran: o iconiță, o întrebare, conținutul și footerul.
 * Ierarhia o fac spacing-ul și greutățile, nu culorile — de asta e un singur accent.
 *
 * Nu are subtitlu. Un rând gri sub întrebare nu spune nimic ce întrebarea nu spune deja.
 */
export function OnboardingCard({ eyebrow, icon, title, tone = 'accent', children, footer }: OnboardingCardProps) {
  const Icon = ICON_MAP[icon]
  const colors = TONE[tone]

  return (
    <Paper
      elevation={1}
      sx={{
        // `width: 100%` explicit: `mx: auto` într-un container flex pe coloană anulează `stretch`,
        // deci fără el cardul s-ar strânge pe lățimea conținutului și ar sări de la un pas la altul.
        width: '100%',
        maxWidth: 720,
        mx: 'auto',
        borderRadius: `${TOKENS.radius.xl}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
        p: { xs: 2.5, sm: 4, md: 5 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 48,
          height: 48,
          borderRadius: `${TOKENS.radius.lg}px`,
          backgroundColor: colors.bg,
          display: 'grid',
          placeItems: 'center',
          mb: 3,
        }}
      >
        <Icon sx={{ fontSize: 24, color: colors.fg }} />
      </Box>

      <Typography variant="overline" component="p" sx={{ color: colors.fg, mb: 1 }}>
        {eyebrow}
      </Typography>

      <Typography variant="h5" component="h1" sx={{ ...displaySx, color: TOKENS.ink }}>
        {title}
      </Typography>

      <Stack sx={{ mt: 4 }}>{children}</Stack>

      {footer && (
        <>
          <Divider sx={{ mt: 4 }} />
          <Box sx={{ mt: 2.5 }}>{footer}</Box>
        </>
      )}
    </Paper>
  )
}
