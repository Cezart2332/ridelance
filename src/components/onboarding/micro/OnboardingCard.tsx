import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { displaySx, TOKENS } from '../onboardingTheme'
import type { MicroStepIcon } from '../microStepTypes'
import { ICON_MAP } from './microStepIcons'

interface OnboardingCardProps {
  eyebrow: string
  icon: MicroStepIcon
  title: string
  subtitle?: string
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
 * Cardul central. Un singur lucru pe ecran: o iconiță, o întrebare, un subtitlu, conținutul și
 * footerul. Ierarhia o fac spacing-ul și greutățile, nu culorile — de asta e un singur accent.
 */
export function OnboardingCard({
  eyebrow,
  icon,
  title,
  subtitle,
  tone = 'accent',
  children,
  footer,
}: OnboardingCardProps) {
  const Icon = ICON_MAP[icon]
  const colors = TONE[tone]

  return (
    <Paper
      elevation={1}
      sx={{
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

      {subtitle && (
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 1 }}>
          {subtitle}
        </Typography>
      )}

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
