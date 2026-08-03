import type { ReactNode } from 'react'
import { Box, Paper, Stack, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { HOME_TOKENS } from '../tokens'

export interface HomeCardProps {
  title: string
  /** Explicație afișată pe iconița „(i)" de lângă titlu. */
  hint?: string
  subtitle?: ReactNode
  /** Colțul din dreapta sus: toggle, total, buton. */
  action?: ReactNode
  /** Accent pe muchia stângă — folosit doar de cardul de rezervă taxe. */
  accent?: string
  /** Conținutul umple restul înălțimii (grafice). */
  fill?: boolean
  children: ReactNode
}

/** Cardul alb standard al paginii „Acasă": border subtil + shadow soft, fără culoare de fundal. */
export function HomeCard({ title, hint, subtitle, action, accent, fill, children }: HomeCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        borderRadius: HOME_TOKENS.radius.card,
        border: `1px solid ${HOME_TOKENS.border.subtle}`,
        borderLeft: accent ? `3px solid ${accent}` : `1px solid ${HOME_TOKENS.border.subtle}`,
        bgcolor: HOME_TOKENS.bg.surface,
        boxShadow: HOME_TOKENS.shadow.card,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.6, flexShrink: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: HOME_TOKENS.text.primary }}>
              {title}
            </Typography>
            {hint && (
              <Tooltip title={hint} enterTouchDelay={0}>
                <InfoOutlinedIcon
                  tabIndex={0}
                  aria-label={hint}
                  sx={{
                    fontSize: 15,
                    color: HOME_TOKENS.text.tertiary,
                    cursor: 'help',
                    '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
                  }}
                />
              </Tooltip>
            )}
          </Stack>
          {subtitle && (
            <Box sx={{ mt: 0.3, fontSize: '0.8rem', color: HOME_TOKENS.text.secondary, lineHeight: 1.5 }}>
              {subtitle}
            </Box>
          )}
        </Box>
        {action}
      </Stack>

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          ...(fill ? { display: 'flex', flexDirection: 'column' } : null),
        }}
      >
        {children}
      </Box>
    </Paper>
  )
}
