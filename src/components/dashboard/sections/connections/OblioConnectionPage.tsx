import { Stack } from '@mui/material'
import { PageHeader } from '../../ui'
import { OwnerOblioConnectionPanel } from '../../invoices/OwnerOblioConnectionPanel'

export function OblioConnectionPage() {
  return <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
    <PageHeader title="Oblio" subtitle="Contul de facturare conectat pentru PFA-ul tău." />
    <OwnerOblioConnectionPanel />
  </Stack>
}
