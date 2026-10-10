import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { useEffect, useState } from 'react'

import { carsService } from '../../../services/cars.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { HIDDEN_PLATE_LEI } from './paidExtras'

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE || '')

/**
 * Plata opțiunii „număr de înmatriculare ascuns” pentru o mașină: o singură dată, în dialog
 * (checkout Stripe integrat). După plată, serverul blurează numărul în pozele mașinii — și în
 * cele urcate înainte, în câteva zeci de secunde.
 *
 * Se deschide din formularul mașinii (adăugare sau editare), nu la publicarea anunțului.
 */
export function HiddenPlateCheckoutDialog({
  carId,
  onClose,
  onPaid,
}: {
  /** `null` = închis. */
  carId: string | null
  /** Închis fără plată: mașina rămâne cu numărul la vedere. */
  onClose: () => void
  onPaid: () => void
}) {
  const [secret, setSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (!carId) return undefined
    let cancelled = false
    carsService
      .createHiddenPlateCheckout(carId)
      .then((next) => !cancelled && setSecret(next))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Nu am putut deschide plata.')))
    return () => {
      cancelled = true
    }
  }, [carId])

  if (!carId) return null

  return (
    <Dialog open onClose={paid ? onPaid : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800 }}>Număr de înmatriculare ascuns — {HIDDEN_PLATE_LEI} lei</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {paid && <Alert severity="success">Plata e confirmată. Numărul se blurează în poze în mai puțin de un minut.</Alert>}
        {!error && !paid && !secret && (
          <Stack sx={{ alignItems: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        )}
        {!paid && secret && (
          <Box sx={{ minHeight: 420 }}>
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret: secret, onComplete: () => setPaid(true) }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={paid ? onPaid : onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {paid ? 'Închide' : 'Renunță'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
