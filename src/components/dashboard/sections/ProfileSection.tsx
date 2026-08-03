import { Stack } from '@mui/material'

import { ProfileTab } from './ProfileTab'
import { BoltConnectCard } from './BoltConnectCard'

/**
 * Profilul, plus singurul modul de platformă care a rămas în contul clientului:
 * butonul de conectare Bolt. Importul rapoartelor Uber e o operațiune de back-office
 * și se face din Admin, în fișa PFA-ului.
 */
export function ProfileSection() {
  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <BoltConnectCard />
      <ProfileTab />
    </Stack>
  )
}
