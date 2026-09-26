import { Paper, Stack } from '@mui/material'

import { EmptyText } from '../components'
import type { DossierTabProps } from '../pfa/PfaDossierView'

/** Placeholder până la etapa F4. */
export function DeclarationsTab({ summary }: DossierTabProps) {
  return (
    <Paper>
      <Stack sx={{ px: 2.5 }}>
        <EmptyText>Vine în etapa F4 ({summary.name}).</EmptyText>
      </Stack>
    </Paper>
  )
}
