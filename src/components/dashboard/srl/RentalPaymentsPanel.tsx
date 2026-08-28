import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

import {
  PAYMENT_METHOD_LABELS,
  rentalPaymentsService,
  type PaymentMethod,
  type RentalPayments,
} from '../../../services/payments.service'
import { type Rental } from '../../../services/rentals.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { Amount, Panel } from '../ui'
import { DateField } from '../../common/DateField'

/**
 * Plățile unei închirieri: contract, încasat, rămas.
 *
 * Nicăieri „profit" sau „câștig" (spec §10). N-avem sursa completă a cheltuielilor unei flote,
 * deci orice cifră numită așa ar fi o minciună convenabilă. Se afișează doar ce s-a înregistrat.
 */

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('ro-RO')

const isoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function RentalPaymentsPanel({ rental }: { rental: Rental }) {
  const [data, setData] = useState<RentalPayments | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    rentalPaymentsService
      .get(rental.id)
      .then(setData)
      .catch(() => setError('Nu am putut încărca plățile.'))
  }, [rental.id])

  useEffect(load, [load])

  const remove = async (paymentId: string) => {
    if (!window.confirm('Ștergi plata înregistrată?')) return
    try {
      await rentalPaymentsService.remove(paymentId)
      load()
    } catch {
      setError('Nu am putut șterge plata.')
    }
  }

  return (
    <Panel
      title="Plăți"
      subtitle="Încasările înregistrate pentru închirierea asta."
      action={
        <Button
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={() => setAdding(true)}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Înregistrează plată
        </Button>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      {!data && !error && <Skeleton variant="rounded" height={120} />}

      {data && (
        <>
          <Stack spacing={0.8} sx={{ mb: 2 }}>
            <SummaryLine label="Contract" bani={data.contractValueBani} />
            <SummaryLine label="Plăți înregistrate" bani={data.recordedBani} />
            <Box sx={{ borderTop: `1px solid ${DASHBOARD_TOKENS.border}`, pt: 0.8 }}>
              <SummaryLine
                label={data.remainingBani < 0 ? 'Încasat în plus' : 'Rămas'}
                bani={Math.abs(data.remainingBani)}
                strong
              />
            </Box>
          </Stack>

          {data.payments.length === 0 ? (
            <Typography sx={{ fontSize: '0.88rem', color: DASHBOARD_TOKENS.textMuted }}>
              Nicio plată înregistrată.
            </Typography>
          ) : (
            <Stack>
              {data.payments.map((payment, index) => (
                <Stack
                  key={payment.id}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.1,
                    borderTop: index === 0 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink }}>
                      {formatDate(payment.paidOnUtc)} · {PAYMENT_METHOD_LABELS[payment.method]}
                    </Typography>
                    {payment.notes && (
                      <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
                        {payment.notes}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <Amount value={payment.amountBani / 100} size="row" />
                    <IconButton size="small" onClick={() => void remove(payment.id)} title="Șterge">
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </>
      )}

      {adding && (
        <AddPaymentDialog
          rentalId={rental.id}
          suggested={data ? Math.max(data.remainingBani, 0) : 0}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            load()
          }}
        />
      )}
    </Panel>
  )
}

function SummaryLine({ label, bani, strong }: { label: string; bani: number; strong?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
      <Typography
        sx={{
          fontSize: '0.88rem',
          fontWeight: strong ? 800 : 400,
          color: strong ? DASHBOARD_TOKENS.ink : DASHBOARD_TOKENS.textMuted,
        }}
      >
        {label}
      </Typography>
      <Amount value={bani / 100} size={strong ? 'card' : 'row'} />
    </Stack>
  )
}

function AddPaymentDialog({
  rentalId,
  suggested,
  onClose,
  onSaved,
}: {
  rentalId: string
  /** Restul de plată, ca punct de plecare. Cel mai des se încasează exact atât. */
  suggested: number
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState(suggested > 0 ? String(suggested / 100) : '')
  const [date, setDate] = useState(() => isoDate(new Date()))
  const [method, setMethod] = useState<PaymentMethod>('BankTransfer')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await rentalPaymentsService.add(rentalId, {
        amountBani: Math.round(Number(amount) * 100),
        paidOnUtc: new Date(`${date}T12:00:00Z`).toISOString(),
        method,
        notes: notes.trim() || null,
      })
      onSaved()
    } catch (cause) {
      const detail = (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Nu am putut înregistra plata.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Înregistrează plată</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Sumă (lei)"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
            autoFocus
          />
          <DateField label="Data încasării" value={date} onChange={setDate} fullWidth size="small" sx={dashboardInputSx} />
          <TextField
            select
            label="Metodă"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => (
              <MenuItem key={key} value={key}>
                {PAYMENT_METHOD_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Observații"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Anulează
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => void save()}
          disabled={saving || Number(amount) <= 0}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
        >
          {saving ? 'Se salvează…' : 'Înregistrează'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
