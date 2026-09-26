import { Paper, Stack } from '@mui/material'

import { EmptyText } from '../components'
import type { DossierTabProps } from '../pfa/PfaDossierView'

/** Placeholder până la etapa F2. */
export function PlatformDocumentsTab({ summary }: DossierTabProps) {
  return (
    <Paper>
      <Stack sx={{ px: 2.5 }}>
        <EmptyText>Vine în etapa F2 ({summary.name}).</EmptyText>
      </Stack>
    </Paper>
  )
}
