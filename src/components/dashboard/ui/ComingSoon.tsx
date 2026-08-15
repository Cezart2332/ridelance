import type { ReactNode } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

export type ComingSoonProps = {
  title: string
  description: string
  /** Ce va putea face pagina. Enumerarea rămâne scurtă — e o promisiune, nu o specificație. */
  upcoming?: string[]
  icon?: ReactNode
}

/**
 * Ecranul unic pentru paginile care există ca rută, dar nu încă și ca funcționalitate.
 *
 * Regula, din spec §11: ruta e navigabilă, item-ul rămâne vizibil în meniu, iar pagina
 * nu face niciun fetch și nu produce nicio eroare în consolă. Fără asta, „În curând"
 * devine o rută moartă care doar arată altfel.
 */
export function ComingSoon({ title, description, upcoming, icon }: ComingSoonProps) {
  return (
    <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          px: { xs: 3, md: 5 },
          py: { xs: 5, md: 7 },
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          bgcolor: DASHBOARD_TOKENS.paper,
        }}
      >
        <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 560, mx: 'auto' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              display: 'grid',
              placeItems: 'center',
              color: DASHBOARD_TOKENS.primaryStrong,
              bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.14),
              '& svg': { fontSize: 28 },
            }}
          >
            {icon ?? <HourglassTopRoundedIcon />}
          </Box>

          <Typography
            component="h2"
            sx={{ fontWeight: 800, fontSize: '1.35rem', color: DASHBOARD_TOKENS.ink, letterSpacing: -0.4 }}
          >
            {title}
          </Typography>

          <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: DASHBOARD_TOKENS.textMuted }}>
            {description}
          </Typography>

          {upcoming && upcoming.length > 0 && (
            <Stack
              component="ul"
              spacing={1}
              sx={{
                listStyle: 'none',
                m: 0,
                mt: 1,
                p: 0,
                width: '100%',
                textAlign: 'left',
              }}
            >
              {upcoming.map((item) => (
                <Stack
                  key={item}
                  component="li"
                  direction="row"
                  spacing={1.4}
                  sx={{ alignItems: 'center' }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      flexShrink: 0,
                      borderRadius: DASHBOARD_TOKENS.radius.full,
                      bgcolor: DASHBOARD_TOKENS.accentSoft,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.88rem', color: DASHBOARD_TOKENS.textMuted }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
