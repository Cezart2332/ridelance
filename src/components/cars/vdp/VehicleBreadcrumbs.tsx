import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Box, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

import { TOKENS } from '../../../constants/tokens'
import { VDP, fullBleed } from './vdpLayout'

/**
 * Banda de breadcrumbs (spec §10): full-bleed, dar cu conținutul aliniat la grila paginii.
 *
 * Ultimul item nu e link — duce unde ești deja.
 */
export function VehicleBreadcrumbs({ current }: { current: string }) {
  const trail = [
    { label: 'Acasă', to: '/' },
    { label: 'Mașini', to: '/masini' },
  ]

  return (
    <Box
      component="nav"
      aria-label="Firimituri"
      sx={{ ...fullBleed, backgroundColor: TOKENS.surfaceAlt, py: 2 }}
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          maxWidth: VDP.maxWidth,
          mx: 'auto',
          px: `${VDP.gutter}px`,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {trail.map((item) => (
          <Stack key={item.to} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              component={Link}
              to={item.to}
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: TOKENS.textMuted,
                textDecoration: 'none',
                '&:hover': { color: TOKENS.ink, textDecoration: 'underline' },
              }}
            >
              {item.label}
            </Box>
            <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: TOKENS.textSubtle }} />
          </Stack>
        ))}

        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: TOKENS.ink }}>
          {current}
        </Typography>
      </Stack>
    </Box>
  )
}
