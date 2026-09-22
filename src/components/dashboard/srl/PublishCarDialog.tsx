import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE || '')

/** Prețurile afișate. Sumele reale le stabilește serverul (`Pricing.PaidExtras`). */
const EXTRA_LISTING_LEI = 40
const HIDDEN_PLATE_LEI = 15

type Step =
  | { kind: 'choose' }
  | { kind: 'pay'; secret: string; what: 'extra' | 'plate' }
  | { kind: 'done'; message: string }

/**
 * Publicarea unui anunț de flotă, cu cele două opțiuni plătite.
 *
 * - **Anunț extra** — când s-au folosit toate anunțurile incluse în abonament: 40 lei pe lună
 *   pentru mașina asta. Nu se publică nimic automat: firma alege să plătească, iar după plată
 *   anunțul intră în piață pe locul lui.
 * - **Număr ascuns** — 15 lei o singură dată; numărul nu mai apare în anunț, nici la republicare.
 *
 * Plata se face aici, în dialog (checkout Stripe integrat), ca firma să nu piardă pagina.
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
  const [hidePlate, setHidePlate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!car) return null

  const extraPaid = car.paymentStatus === 'Paid'
  const needsExtra = !extraPaid && quota !== null && quota.remaining === 0
  const canHidePlate = !car.plateHidden

  const close = () => {
    setStep({ kind: 'choose' })
    setHidePlate(false)
    setError(null)
    onClose()
  }

  const payPlateOrFinish = async (message: string) => {
    if (hidePlate && canHidePlate) {
      setStep({ kind: 'pay', secret: await carsService.createHiddenPlateCheckout(car.id), what: 'plate' })
      return
    }
    setStep({ kind: 'done', message })
    onChanged()
  }

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      if (needsExtra) {
        setStep({ kind: 'pay', secret: await carsService.createExtraListingCheckout(car.id), what: 'extra' })
      } else {
        await carsService.toggleActive(car.id)
        await payPlateOrFinish('Anunțul e publicat.')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut publica anunțul.'))
    } finally {
      setBusy(false)
    }
  }

  const paymentDone = async (what: 'extra' | 'plate') => {
    try {
      if (what === 'extra') {
        onChanged()
        await payPlateOrFinish('Plata e confirmată. Anunțul extra intră în piață în câteva secunde.')
      } else {
        setStep({ kind: 'done', message: 'Plata e confirmată. Numărul de înmatriculare nu mai apare în anunț.' })
        onChanged()
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Plata a mers, dar nu am putut deschide plata pentru numărul ascuns.'))
      setStep({ kind: 'done', message: 'Anunțul extra e plătit.' })
    }
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth={step.kind === 'pay' ? 'md' : 'sm'}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {step.kind === 'pay'
          ? step.what === 'extra'
            ? `Anunț extra — ${EXTRA_LISTING_LEI} lei / lună`
            : `Număr de înmatriculare ascuns — ${HIDDEN_PLATE_LEI} lei`
          : `Publică ${car.brand} ${car.model}`}
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

            {canHidePlate ? (
              <FormControlLabel
                control={<Checkbox checked={hidePlate} onChange={(event) => setHidePlate(event.target.checked)} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: DASHBOARD_TOKENS.ink }}>
                      Ascunde numărul de înmatriculare în anunț — {HIDDEN_PLATE_LEI} lei
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
                      O singură dată pentru mașina asta: rămâne ascuns și dacă retragi și republici anunțul.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0, gap: 0.5, '& .MuiCheckbox-root': { pt: 0.25 } }}
              />
            ) : (
              <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>
                Numărul de înmatriculare e deja ascuns în anunț.
              </Typography>
            )}
          </Stack>
        )}

        {step.kind === 'pay' && (
          // Cheia remontează plata la trecerea de la anunțul extra la numărul ascuns.
          <Box key={step.secret} sx={{ minHeight: 420 }}>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: step.secret, onComplete: () => void paymentDone(step.what) }}
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
              ) : hidePlate ? (
                `Publică și plătește ${HIDDEN_PLATE_LEI} lei`
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
