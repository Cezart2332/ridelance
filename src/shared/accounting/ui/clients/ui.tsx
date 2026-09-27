import type { ReactNode } from 'react'
import { Avatar, Box, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../../../constants/tokens'
import { initials } from './text'

export function ClientAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 650,
        bgcolor: alpha(TOKENS.primary, 0.16),
        color: TOKENS.ink,
      }}
    >
      {initials(name) || '?'}
    </Avatar>
  )
}

/** Tab-uri „pilulă”: fundal discret, tabul activ pe alb. */
export function PillTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <Box sx={{ maxWidth: '100%', minWidth: 0 }}>
      <Tabs
        value={value}
        onChange={(_, next: T) => onChange(next)}
        variant="scrollable"
        scrollButtons={false}
        aria-label={label}
        sx={{
          minHeight: 0,
          display: 'inline-flex',
          maxWidth: '100%',
          p: 0.5,
          borderRadius: `${TOKENS.radius.md + 2}px`,
          bgcolor: alpha(TOKENS.ink, 0.045),
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTabs-flexContainer': { gap: 0.25 },
          '& .MuiTab-root': {
            minHeight: 32,
            minWidth: 0,
            px: 1.5,
            py: 0.5,
            borderRadius: `${TOKENS.radius.md}px`,
            fontSize: 13,
            fontWeight: 600,
            color: 'text.secondary',
            transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          },
          '& .MuiTab-root.Mui-selected': {
            color: 'text.primary',
            bgcolor: TOKENS.paper,
            boxShadow: '0 1px 3px rgba(26, 26, 46, 0.10)',
          },
        }}
      >
        {options.map((option) => (
          <Tab key={option.value} value={option.value} label={option.label} disableRipple />
        ))}
      </Tabs>
    </Box>
  )
}

/** Card cu titlu și, opțional, o acțiune în dreapta titlului. */
export function Card({ title, action, children, padded = true }: { title?: string; action?: ReactNode; children: ReactNode; padded?: boolean }) {
  return (
    <Paper sx={{ overflow: 'hidden', minWidth: 0 }}>
      {title && (
        <Stack direction="row" sx={{ px: 2.5, pt: 2, pb: padded ? 0 : 1.5, alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="subtitle2" component="h2">
            {title}
          </Typography>
          {action}
        </Stack>
      )}
      <Box sx={padded ? { p: 2.5 } : undefined}>{children}</Box>
    </Paper>
  )
}
