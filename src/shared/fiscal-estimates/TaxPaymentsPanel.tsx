import { useEffect, useState } from 'react'
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { ANNUAL_TAX_TYPES, estimatedTaxesService, type TaxPayment } from '../../services/estimatedTaxes.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { formatLei } from './texts'

const TYPE_LABEL: Record<(typeof ANNUAL_TAX_TYPES)[number], string> = {
  Cas: 'CAS (pensie)',
  Cass: 'CASS (sănătate)',
  ImpozitVenit: 'Impozit pe venit',
}

/**
 * Plățile CAS/CASS/impozit deja făcute pentru anul fiscal, înregistrate de contabilă sau admin ca
 * declarații „Plătită”. Se scad din „Cât să pui deoparte”.
 */
export function TaxPaymentsPanel({ pfaId, taxYear, onChanged }: { pfaId: string; taxYear: number; onChanged: () => void }) {
  const [items, setItems] = useState<TaxPayment[] | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [type, setType] = useState<(typeof ANNUAL_TAX_TYPES)[number]>('Cass')
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    estimatedTaxesService
      .payments(pfaId, taxYear)
      .then((loaded) => !cancelled && setItems(loaded))
      .catch(() => !cancelled && setItems([]))
    return () => {
      cancelled = true
    }
  }, [pfaId, taxYear, reloadToken])

  const add = async () => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0 || !paidOn) {
      setError('Completează suma și data plății.')
      return
    }
    setBusy(true)
    try {
      await estimatedTaxesService.addPayment(pfaId, taxYear, type, value, paidOn)
      setAmount('')
      setError(null)
      setReloadToken((t) => t + 1)
      onChanged()
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut înregistra plata.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Plăți înregistrate pentru {taxYear}
      </Typography>
      {items?.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Nicio plată CAS/CASS/impozit înregistrată.
        </Typography>
      )}
      <Stack component="ul" spacing={0.25} sx={{ listStyle: 'none', p: 0, m: 0, mt: 0.5 }}>
        {items?.map((item) => (
          <Typography key={item.id} component="li" variant="body2">
            {item.typeLabel} · {formatLei(item.amountDue)} · {new Date(item.dueDate).toLocaleDateString('ro-RO')} · {item.statusLabel}
          </Typography>
        ))}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
        <TextField select size="small" label="Tip" value={type} onChange={(e) => setType(e.target.value as typeof type)} sx={{ minWidth: 170 }}>
          {ANNUAL_TAX_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {TYPE_LABEL[t]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="number"
          label="Sumă plătită (lei)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
        <TextField
          size="small"
          type="date"
          label="Data plății"
          value={paidOn}
          onChange={(e) => setPaidOn(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="outlined" onClick={() => void add()} disabled={busy}>
          Adaugă plata
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}
