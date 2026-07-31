import { Box, Stack } from '@mui/material'
import { InsuranceLinksGrid } from '../../insurance/InsuranceLinksGrid'
import { PageHeader } from '../ui'

export function InsuranceTab() {
  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Asigurări"
        subtitle="Prin partenerul nostru asigurari.ro poți obține rapid oferte pentru toate tipurile de asigurări de care ai nevoie. Alege categoria potrivită, iar oferta se deschide direct pe asigurari.ro."
      />
      <Box>
        <InsuranceLinksGrid compact />
      </Box>
    </Stack>
  )
}
