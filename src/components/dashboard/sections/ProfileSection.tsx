import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Box, Button, Collapse, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

import { ProfileTab } from './ProfileTab'
import { IstoricPlatiTab } from './IstoricPlatiTab'
import { SecurityPanel } from './profile/SecurityPanel'
import { NotificationPreferencesPanel } from './profile/NotificationPreferencesPanel'
import { PrivacyPanel } from './profile/PrivacyPanel'

/**
 * Profilul: datele contului, abonamentul, istoricul plăților, securitatea, preferințele de
 * notificări și confidențialitatea — tot ce ține de cont, într-un singur loc (spec §10.4).
 *
 * Conectarea Bolt a plecat la Conexiuni → Bolt; profilul rămâne despre cont, nu despre
 * platformele externe.
 */
export function ProfileSection() {
  const { hash } = useLocation()

  /**
   * Istoricul plăților e închis implicit.
   *
   * Lista crește cu fiecare lună de abonament și împingea securitatea, notificările și
   * confidențialitatea sub trei ecrane de derulare — setări la care te uiți rar, dar pe care
   * atunci le cauți. Un istoric e o arhivă: se deschide când ai nevoie de el.
   */
  /*
   * Starea implicită vine din adresă: `#plati` o deschide, altfel e închisă. Preferința manuală
   * o suprascrie, dar e legată de hash-ul curent — o nouă navigare la `#plati` redeschide lista,
   * fără să sincronizăm starea printr-un efect.
   */
  const [override, setOverride] = useState<{ key: string; open: boolean } | null>(null)
  const paymentsOpen = override?.key === hash ? override.open : hash === '#plati'

  // Notificarea de plată din webhook-ul Stripe și linkul vechi `?section=istoric_plati`
  // trimit direct la secțiunea de plăți, care e la jumătatea paginii.
  useEffect(() => {
    if (hash !== '#plati') return
    document.getElementById('plati')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <ProfileTab />

      <Box id="plati" sx={{ scrollMarginTop: 96 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            bgcolor: DASHBOARD_TOKENS.paper,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
            overflow: 'hidden',
          }}
        >
          <Button
            onClick={() => setOverride({ key: hash, open: !paymentsOpen })}
            aria-expanded={paymentsOpen}
            aria-controls="istoric-plati"
            sx={{
              width: '100%',
              justifyContent: 'flex-start',
              gap: 1.5,
              px: { xs: 2.2, md: 2.6 },
              py: 2,
              textTransform: 'none',
              color: 'inherit',
              borderRadius: 0,
              '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.04) },
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: `${DASHBOARD_TOKENS.radius.sm}px`,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.1),
                color: DASHBOARD_TOKENS.accent,
              }}
            >
              <ReceiptLongRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: DASHBOARD_TOKENS.ink }}>
                Istoric plăți
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                Facturi și încasări pe abonament
              </Typography>
            </Box>
            <ExpandMoreRoundedIcon
              sx={{
                flexShrink: 0,
                color: DASHBOARD_TOKENS.textMuted,
                transform: paymentsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 180ms ease',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            />
          </Button>

          {/* `unmountOnExit`: lista își face propriile cereri, iar închisă n-are de ce să le facă. */}
          <Collapse in={paymentsOpen} unmountOnExit>
            <Box id="istoric-plati" sx={{ px: { xs: 2.2, md: 2.6 }, pb: 2.5 }}>
              <IstoricPlatiTab />
            </Box>
          </Collapse>
        </Paper>
      </Box>
      <SecurityPanel />
      <NotificationPreferencesPanel />
      {/* Confidențialitatea stă la final, cum cere spec-ul §10.4. */}
      <PrivacyPanel />
    </Stack>
  )
}
