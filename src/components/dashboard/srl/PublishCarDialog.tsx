import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { useState } from 'react'

import { carsService, type Car, type ListingQuota } from '../../../services/cars.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { EXTRA_LISTING_LEI } from './paidExtras'

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE || '')

type Step =
  | { kind: 'choose' }
  | { kind: 'pay'; secret: string }
  | { kind: 'done'; message: string }

/**
 * Publicarea unui anunț de flotă.
 *
 * Când s-au folosit toate anunțurile incluse în abonament, mașina se poate publica drept **anunț
 * extra**: 39,90 lei pe lună. Nu se publică nimic automat: firma alege să plătească, iar după
 * plată anunțul intră în piață pe locul lui. Plata se face aici, în dialog (checkout Stripe
 * integrat), ca firma să nu piardă pagina.
 *
 * Numărul de înmatriculare ascuns nu se mai întreabă aici: e în formularul mașinii, unde se urcă
 * și pozele.
 */
export function PublishCarDialog({
  car,
  quota,
  onClose,
  onChanged,
}: {
  car: Car | null
  quota: ListingQuota | null
  onClose: () => void
  /** Anunțul s-a publicat sau s-a plătit ceva: lista se reîncarcă. */
  onChanged: () => void
}) {
  const [step, setStep] = useState<Step>({ kind: 'choose' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!car) return null

  const extraPaid = car.paymentStatus === 'Paid'
  const needsExtra = !extraPaid && quota !== null && quota.remaining === 0

  const close = () => {
    setStep({ kind: 'choose' })
    setError(null)
    onClose()
  }

  const finish = (message: string) => {
    setStep({ kind: 'done', message })
    onChanged()
  }

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      if (needsExtra) {
        setStep({ kind: 'pay', secret: await carsService.createExtraListingCheckout(car.id) })
      } else {
        await carsService.toggleActive(car.id)
        finish('Anunțul e publicat.')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut publica anunțul.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth={step.kind === 'pay' ? 'md' : 'sm'}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {step.kind === 'pay' ? `Anunț extra — ${EXTRA_LISTING_LEI} lei / lună` : `Publică ${car.brand} ${car.model}`}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step.kind === 'choose' && (
          <Stack spacing={2}>
            {needsExtra ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                  border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.35)}`,
                  backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.06),
                }}
              >
                <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                  Ai folosit toate cele {quota?.included} anunțuri incluse în abonament.
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
                  Poți publica mașina asta ca anunț extra, cu {EXTRA_LISTING_LEI} lei pe lună. Se plătește cât timp
                  anunțul extra e activ și îl poți opri oricând din meniul mașinii.
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.92rem', color: DASHBOARD_TOKENS.textMuted }}>
                {extraPaid
                  ? 'Mașina are un anunț extra plătit: se publică pe locul ei.'
                  : `Anunțul intră într-unul dintre locurile incluse în abonament${quota ? ` (mai ai ${quota.remaining} din ${quota.included})` : ''}.`}
              </Typography>
            )}
          </Stack>
        )}

        {step.kind === 'pay' && (
          <Box sx={{ minHeight: 420 }}>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                clientSecret: step.secret,
                onComplete: () => finish('Plata e confirmată. Anunțul extra intră în piață în câteva secunde.'),
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </Box>
        )}

        {step.kind === 'done' && <Alert severity="success">{step.message}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {step.kind === 'choose' && (
          <>
            <Button onClick={close} disabled={busy} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Anulează
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => void start()}
              disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 800 }}
            >
              {busy ? (
                <CircularProgress size={18} color="inherit" />
              ) : needsExtra ? (
                `Plătește anunțul extra (${EXTRA_LISTING_LEI} lei / lună)`
              ) : (
                'Publică anunțul'
              )}
            </Button>
          </>
        )}
        {step.kind !== 'choose' && (
          <Button onClick={close} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {step.kind === 'done' ? 'Închide' : 'Renunță'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
