import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { Box, Button, Stack } from '@mui/material'

import { TOKENS } from '../onboardingTheme'
import { StepProgressRing } from './StepProgressRing'

export const TOPBAR_HEIGHT = 64

interface OnboardingTopBarProps {
  position: number
  total: number
  percent: number
  canGoBack: boolean
  onBack: () => void
  onLogout: () => void
}

/**
 * Bara de sus: unde ești, cât mai ai, și cele două ieșiri (înapoi un ecran, sau afară din cont).
 *
 * Nu există buton de „salvează": fiecare răspuns și fiecare document pleacă la server în clipa în
 * care e dat, deci nu se poate pierde nimic închizând pagina. Un buton care nu face nimic în plus
 * doar sugerează că fără el ai fi pierdut ceva.
 *
 * Progresul se măsoară pe micro-pași, nu pe pașii mari. Pe pași mari inelul ar sta blocat minute
 * întregi și userul ar crede că nu avansează.
 */
export function OnboardingTopBar({
  position,
  total,
  percent,
  canGoBack,
  onBack,
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
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Button
          onClick={onBack}
          disabled={!canGoBack}
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{ color: TOKENS.textMuted }}
        >
          Înapoi
        </Button>
      </Box>

      <StepProgressRing position={position} total={total} percent={percent} />

      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
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
