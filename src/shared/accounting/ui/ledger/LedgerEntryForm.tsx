import { MenuItem, Stack, TextField } from '@mui/material'

import {
  LEDGER_TRANSACTION_TYPES,
  PAYMENT_METHODS,
  type ExpenseCategoryRule,
  type LedgerTransactionType,
  type PaymentMethod,
} from '../../api/types'
import { parseAmount } from '../../format'
import { LEDGER_TRANSACTION_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '../../statusLabels'
import type { LedgerFormValues } from './ledgerForm'

/** Câmpurile unei tranzacții, pentru modificare, adăugare manuală și corecție controlată. */
export function LedgerEntryForm({
  values,
  categories,
  onChange,
}: {
  values: LedgerFormValues
  categories: ExpenseCategoryRule[]
  onChange: (values: LedgerFormValues) => void
}) {
  const set = <K extends keyof LedgerFormValues>(key: K, value: LedgerFormValues[K]) => onChange({ ...values, [key]: value })
  const invalidAmount = values.amount.trim() !== '' && parseAmount(values.amount) === null

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
        <TextField type="date" label="Data" value={values.date} onChange={(event) => set('date', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <TextField label="Document justificativ" value={values.documentLabel} onChange={(event) => set('documentLabel', event.target.value)} fullWidth />
      </Stack>
      <TextField label="Contrapartidă" value={values.counterparty} onChange={(event) => set('counterparty', event.target.value)} />
      <TextField label="Descriere" value={values.description} onChange={(event) => set('description', event.target.value)} />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
        <TextField select label="Tip" value={values.transactionType} onChange={(event) => set('transactionType', event.target.value as LedgerTransactionType)} fullWidth>
          {LEDGER_TRANSACTION_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {LEDGER_TRANSACTION_TYPE_LABEL[type]}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Metodă" value={values.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value as PaymentMethod)} fullWidth>
          {PAYMENT_METHODS.map((method) => (
            <MenuItem key={method} value={method}>
              {PAYMENT_METHOD_LABEL[method]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Sumă (lei)"
          value={values.amount}
          onChange={(event) => set('amount', event.target.value)}
          error={invalidAmount}
          helperText={invalidAmount ? 'Sumă invalidă' : undefined}
          fullWidth
        />
      </Stack>
      {values.transactionType === 'EXPENSE' && (
        <TextField select label="Categorie" value={values.category} onChange={(event) => set('category', event.target.value)}>
          <MenuItem value="">Neclasificată</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.category}>
              {category.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Stack>
  )
}
