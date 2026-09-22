import { Stack } from '@mui/material'

import { PageHeader } from '../../ui'
import { FiscalProfilePanel, usePfaFiscalProfile } from '../../../../shared/fiscal-profile'

/**
 * Contabilitate → Profil fiscal. Statusul profilului anului și butonul care deschide formularul
 * comun al dashboardului (completează / continuă / editează), plus istoricul.
 */
export function FiscalProfilePage() {
  const fiscal = usePfaFiscalProfile()

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
      <PageHeader
        title="Profil fiscal"
        subtitle="Situația ta pentru anul fiscal: din ea se estimează cât să pui deoparte pentru taxe."
      />
      <FiscalProfilePanel
        mode="pfa"
        profile={fiscal?.profile ?? null}
        onOpenForm={fiscal?.openForm}
        onOpenHistory={fiscal?.openHistory}
      />
    </Stack>
  )
}
