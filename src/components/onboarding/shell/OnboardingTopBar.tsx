import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material'

import { tabularSx, TOKENS } from '../onboardingTheme'

export const TOPBAR_HEIGHT = 64

interface OnboardingTopBarProps {
  position: number
  total: number
  percent: number
  canGoBack: boolean
  onBack: () => void
  onSaveAndExit: () => void
  onLogout: () => void
}

/**
 * Bara de sus: unde ești, cât mai ai, și cele două ieșiri (înapoi un ecran, sau salvează și pleacă).
 *
 * Procentul se calculează pe micro-pași, nu pe pașii mari. Pe pași mari bara ar sta blocată
 * minute întregi și userul ar crede că nu avansează.
 */
export function OnboardingTopBar({
  position,
  total,
  percent,
  canGoBack,
  onBack,
  onSaveAndExit,
  onLogout,
}: OnboardingTopBarProps) {
  return (
    <Box
      component="header"
      sx={{
        height: TOPBAR_HEIGHT,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: TOKENS.paper,
        borderBottom: `1px solid ${TOKENS.border}`,
      }}
    >
      {/* Logoul stă în capul rail-ului, nu aici — o dată pe ecran e de ajuns. */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
        <Button
          onClick={onBack}
          disabled={!canGoBack}
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{ color: TOKENS.textMuted, flexShrink: 0 }}
        >
          Înapoi
        </Button>
      </Stack>

      {/* Progresul e centrat pentru că e singurul lucru pe care userul îl caută din priviri. */}
      <Stack sx={{ width: { xs: 140, sm: 240, md: 320 }, flexShrink: 0, gap: 0.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="caption" sx={{ ...tabularSx, color: TOKENS.textMuted }}>
            Pasul {position} din {total}
          </Typography>
          <Typography variant="caption" sx={{ ...tabularSx, color: TOKENS.textMuted }}>
            {percent}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={percent}
          aria-label="Progresul înrolării"
          sx={{ height: 4 }}
        />
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onSaveAndExit}
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
            color: TOKENS.ink,
            borderColor: TOKENS.borderHover,
            flexShrink: 0,
          }}
        >
          Salvează și continuă mai târziu
        </Button>
        <Button
          onClick={onLogout}
          startIcon={<LogoutRoundedIcon sx={{ fontSize: 17 }} />}
          sx={{ color: TOKENS.textMuted, flexShrink: 0 }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Ieși din cont
          </Box>
        </Button>
      </Stack>
    </Box>
  )
}
