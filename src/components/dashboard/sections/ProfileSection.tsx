import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Box, Stack } from '@mui/material'

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
        <IstoricPlatiTab />
      </Box>
      <SecurityPanel />
      <NotificationPreferencesPanel />
      {/* Confidențialitatea stă la final, cum cere spec-ul §10.4. */}
      <PrivacyPanel />
    </Stack>
  )
}
