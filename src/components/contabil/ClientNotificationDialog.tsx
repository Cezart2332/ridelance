import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { isAxiosError } from 'axios'

import { TOKENS } from '../../constants/tokens'
import { pfaService, type ClientNotificationDestination } from '../../services/pfa.service'
import {
  formatAccountingDeadline,
  formatAccountingMonth,
  requestedAccountingMonth,
} from '../../utils/accountingPeriod'

const MAX_LENGTH = 1000

const DESTINATIONS: { value: ClientNotificationDestination | ''; label: string }[] = [
  { value: '', label: 'Doar notificarea' },
  { value: 'RecurringDocuments', label: 'Documente lunare' },
  { value: 'Documents', label: 'Documente' },
  { value: 'Taxes', label: 'Taxe' },
  { value: 'FiscalProfile', label: 'Profil fiscal' },
  { value: 'AccountantChat', label: 'Chat cu contabilul' },
]

/** Mesaje gata scrise, pe luna contabilă deschisă acum. */
function templates(): { label: string; text: string; destination: ClientNotificationDestination }[] {
  const target = requestedAccountingMonth()
  const month = formatAccountingMonth(target)
  const deadline = formatAccountingDeadline(target)
  return [
    {
      label: 'Documente lunare',
      text: `Te rog să încarci documentele pentru ${month} până pe ${deadline}, ca să pot închide luna.`,
      destination: 'RecurringDocuments',
    },
    {
      label: 'Document respins',
      text: 'Unul dintre documentele încărcate nu e bun. Te rog să verifici motivul și să încarci din nou documentul.',
      destination: 'Documents',
    },
    {
      label: 'Profil fiscal',
      text: 'Te rog să completezi profilul fiscal, ca să pot calcula corect taxele.',
      destination: 'FiscalProfile',
    },
  ]
}

interface ClientNotificationDialogProps {
  open: boolean
  pfaId: string
  clientName: string
  onClose: () => void
  onSent: (pushSent: number) => void
}

export function ClientNotificationDialog({ open, pfaId, clientName, onClose, onSent }: ClientNotificationDialogProps) {
  const [text, setText] = useState('')
  const [destination, setDestination] = useState<ClientNotificationDestination | ''>('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setText('')
    setDestination('')
    setError(null)
  }

  const handleClose = () => {
    if (sending) return
    reset()
    onClose()
  }

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      const result = await pfaService.sendClientNotification(pfaId, text.trim(), destination || null)
      reset()
      onSent(result.pushSent)
    } catch (err) {
      const detail = isAxiosError(err) ? (err.response?.data as { detail?: string } | undefined)?.detail : undefined
      setError(detail ?? 'Notificarea nu a putut fi trimisă. Încearcă din nou.')
    } finally {
      setSending(false)
    }
  }

  const trimmed = text.trim()

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Trimite notificare</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            {clientName} o primește în aplicație și pe telefon, dacă are notificările activate.
          </Typography>

          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {templates().map((template) => (
              <Chip
                key={template.label}
                label={template.label}
                variant="outlined"
                onClick={() => {
                  setText(template.text)
                  setDestination(template.destination)
                }}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>

          <TextField
            label="Mesaj"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            multiline
            minRows={4}
            fullWidth
            autoFocus
            helperText={`${text.length}/${MAX_LENGTH}`}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Duce clientul la</InputLabel>
            <Select
              label="Duce clientul la"
              value={destination}
              onChange={(e) => setDestination(e.target.value as ClientNotificationDestination | '')}
            >
              {DESTINATIONS.map((option) => (
                <MenuItem key={option.value || 'none'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={sending} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Anulează
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSend()}
          disabled={sending || trimmed.length === 0}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {sending ? 'Se trimite…' : 'Trimite'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
