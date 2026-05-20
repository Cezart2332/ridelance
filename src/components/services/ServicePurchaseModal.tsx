import { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { TOKENS } from '../../constants/tokens'
import { stripeService, type ServiceKey } from '../../services/stripe.service'

export interface ServicePurchaseTarget {
  key: ServiceKey
  title: string
  price: string
}

interface ServicePurchaseModalProps {
  open: boolean
  service: ServicePurchaseTarget | null
  onClose: () => void
}

export function ServicePurchaseModal({ open, service, onClose }: ServicePurchaseModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (submitting) return
    onClose()
    setTimeout(() => {
      setName('')
      setEmail('')
      setPhone('')
      setError(null)
    }, 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service) return

    setSubmitting(true)
    setError(null)
    try {
      await stripeService.redirectToPublicService(service.key, {
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
      })
    } catch {
      setError('Nu am putut deschide plata. Te rugăm să încerci din nou.')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        {service ? `Comandă: ${service.title}` : 'Comandă serviciu'}
        <IconButton
          onClick={handleClose}
          disabled={submitting}
          sx={{ position: 'absolute', right: 12, top: 12 }}
          aria-label="Închide"
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2.5}>
            {service && (
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.95rem' }}>
                Preț: <strong style={{ color: TOKENS.ink }}>{service.price}</strong>
                . Completează datele de contact; vei fi redirecționat către Stripe pentru plată.
              </Typography>
            )}
            <TextField
              label="Nume complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Număr de telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              fullWidth
            />
            {error && (
              <Typography sx={{ color: 'error.main', fontSize: '0.9rem' }}>{error}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Anulează
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !service}
            sx={{
              fontWeight: 700,
              borderRadius: TOKENS.radius.full,
              bgcolor: TOKENS.primary,
              '&:hover': { bgcolor: TOKENS.primaryStrong },
            }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Continuă la plată'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
