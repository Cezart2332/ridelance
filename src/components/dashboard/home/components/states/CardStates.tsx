import { Box, Skeleton, Stack, Typography } from '@mui/material'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'

import { HOME_TOKENS } from '../../tokens'

/**
 * Skeleton-urile au exact dimensiunile conținutului final, ca trecerea la date reale
 * să nu miște layoutul. Fără spinner global.
 */
export function TileSkeleton() {
  return (
    <Skeleton
      variant="rectangular"
      sx={{
        height: { xs: 88, sm: 140 },
        borderRadius: HOME_TOKENS.radius.tile,
        bgcolor: HOME_TOKENS.bg.surface2,
      }}
    />
  )
}

export function CardSkeleton({ height }: { height: number }) {
  return (
    <Skeleton
      variant="rectangular"
      sx={{ height, borderRadius: HOME_TOKENS.radius.card, bgcolor: HOME_TOKENS.bg.surface2 }}
    />
  )
}

/** Eroarea e per card, nu per pagină — restul dashboardului rămâne funcțional. */
export function CardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Stack spacing={1.2} sx={{ py: 4, alignItems: 'center', textAlign: 'center' }}>
      <ErrorOutlineRoundedIcon sx={{ fontSize: 32, color: HOME_TOKENS.text.tertiary }} />
      <Typography sx={{ fontSize: '0.86rem', color: HOME_TOKENS.text.secondary, maxWidth: 320 }}>
        {message}
      </Typography>
      <Box
        component="button"
        type="button"
        onClick={onRetry}
        sx={{
          px: 1.6,
          py: 0.7,
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          borderRadius: HOME_TOKENS.radius.input,
          border: `1px solid ${HOME_TOKENS.border.strong}`,
          bgcolor: HOME_TOKENS.bg.surface,
          color: HOME_TOKENS.text.primary,
          '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
        }}
      >
        Reîncearcă
      </Box>
    </Stack>
  )
}

export function CardEmpty({ message, actionLabel, onAction }: {
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Stack spacing={1} sx={{ py: 4, alignItems: 'center', textAlign: 'center' }}>
      <InboxRoundedIcon sx={{ fontSize: 40, color: HOME_TOKENS.text.tertiary }} />
      <Typography sx={{ fontSize: '0.86rem', color: HOME_TOKENS.text.secondary }}>{message}</Typography>
      {actionLabel && onAction && (
        <Box
          component="button"
          type="button"
          onClick={onAction}
          sx={{
            border: 'none',
            background: 'none',
            p: 0,
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: HOME_TOKENS.brand[600],
            '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
          }}
        >
          {actionLabel}
        </Box>
      )}
    </Stack>
  )
}
