import { Alert, Button } from '@mui/material'

import type { SubscriptionPaymentRetry } from '../../services/stripe.service'

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/**
 * Reînnoirea abonamentului n-a trecut. Clientul află de ce, când reîncercăm și până când are timp,
 * și poate plăti singur factura, și cu alt card. Accesul rămâne până la ultima reîncercare.
 */
export function PaymentRetryBanner({ retry }: { retry: SubscriptionPaymentRetry }) {
  return (
    <Alert
      severity="warning"
      sx={{ mb: 2, alignItems: 'center' }}
      action={
        retry.payPage ? (
          <Button color="inherit" size="small" href={retry.payPage} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            Plătește acum
          </Button>
        ) : undefined
      }
    >
      Plata abonamentului nu a trecut{retry.failureReason ? `: ${retry.failureReason}` : ''}. Reîncercăm pe{' '}
      {dateTime(retry.nextAttemptAtUtc)}; dacă nu trece până pe {dateTime(retry.suspendsAtUtc)}, accesul se suspendă.
    </Alert>
  )
}
