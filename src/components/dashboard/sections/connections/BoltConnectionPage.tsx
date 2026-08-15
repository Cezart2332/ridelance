import { Stack } from '@mui/material'

import { BoltConnectCard } from '../BoltConnectCard'
import { PlatformAccountsPanel } from './PlatformAccountsPanel'
import { PageHeader } from '../../ui'

/**
 * Conexiuni → Bolt. Conectarea API rămâne exact cum era; ce s-a schimbat e locul:
 * cardul de conectare venea din Profil, iar conturile de șofer/flotă dintr-un panou
 * cu taburi care amesteca Bolt și Uber.
 */
export function BoltConnectionPage() {
  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Bolt"
        subtitle="Conexiunea API, statusul sincronizării și conturile tale Bolt."
      />
      <BoltConnectCard />
      <PlatformAccountsPanel provider="Bolt" />
    </Stack>
  )
}
