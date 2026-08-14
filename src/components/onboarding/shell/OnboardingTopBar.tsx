import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { SHELL, SHELL_LAYOUT } from '../shellTokens'

interface OnboardingTopBarProps {
  /** Pasul mare curent, 1-based. */
  stepPosition: number
  stepTotal: number
  stepLabel: string | null
  canGoBack: boolean
  onBack: () => void
  onLogout: () => void
}

/**
 * Bara de sus: unde ești și cele două ieșiri (înapoi un ecran, sau afară din cont).
 *
 * UN SINGUR contor. Înainte topbarul spunea „Pasul 1 din 11" (numărând micro-pași) iar rail-ul
 * „0 din 6" (numărând pași mari) — două sisteme care se contraziceau pe același ecran. Rămâne
 * numărătoarea pe pași mari; micro-pașii se numără doar în interiorul pasului curent, în rail.
 *
 * „Ieși din cont" a intrat în meniul de cont: e o acțiune rară și distructivă, n-are ce căuta
 * permanent în colț, la un click distanță de butoanele pe care userul chiar le apasă.
 */
export function OnboardingTopBar({
  stepPosition,
  stepTotal,
  stepLabel,
  canGoBack,
  onBack,
  onLogout,
}: OnboardingTopBarProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  return (
    <Box
      component="header"
      sx={{
        height: SHELL_LAYOUT.topbarHeight,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        // Opac, fără backdrop-filter: altfel conținutul se vede prin bară la scroll.
        backgroundColor: SHELL.bg.surface,
        borderBottom: `1px solid ${SHELL.border.subtle}`,
      }}
    >
      {/* Logoul stă în capul rail-ului, nu aici — o dată pe ecran e de ajuns. */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* „Înapoi" apare doar când chiar ai unde te întoarce. */}
        {canGoBack && (
          <Button
            onClick={onBack}
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{ color: SHELL.text.secondary, textTransform: 'none', fontWeight: 600 }}
          >
            Înapoi
          </Button>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', minWidth: 0 }}>
        <Typography
          sx={{ ...SHELL.tabular, fontSize: 13, fontWeight: 600, color: SHELL.text.secondary, flexShrink: 0 }}
        >
          Pasul {stepPosition} din {stepTotal}
        </Typography>
        {stepLabel && (
          <Typography
            noWrap
            sx={{ fontSize: 14, fontWeight: 600, color: SHELL.text.primary, minWidth: 0 }}
          >
            {stepLabel}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
        <IconButton
          aria-label="Meniul contului"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={{ color: SHELL.text.secondary }}
        >
          <AccountCircleRoundedIcon sx={{ fontSize: 22 }} />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={menuAnchor !== null}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              onLogout()
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 18, mr: 1.25, color: SHELL.text.secondary }} />
            Ieși din cont
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  )
}
