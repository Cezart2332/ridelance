import { Button, Stack, TextField } from '@mui/material'
import { useState } from 'react'

/**
 * Codul de reducere pentru plățile per mașină, deasupra checkoutului Stripe.
 *
 * Stripe are și el un câmp de cod, dar în dialogul îngust își strânge rezumatul comenzii și câmpul
 * rămâne ascuns acolo. Aici codul se aplică pe server: sesiunea se refă cu reducerea pe ea.
 */
export function DiscountCodeField({
  busy,
  applied,
  onApply,
}: {
  busy: boolean
  /** Codul aflat acum pe plată. */
  applied: string | null
  onApply: (code: string) => void
}) {
  const [code, setCode] = useState(applied ?? '')
  const trimmed = code.trim()

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'flex-start' }}>
      <TextField
        size="small"
        label="Cod de reducere"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && trimmed && trimmed !== applied) onApply(trimmed)
        }}
        disabled={busy}
        sx={{ flex: 1, maxWidth: 280 }}
        slotProps={{ htmlInput: { autoCapitalize: 'characters', spellCheck: false } }}
      />
      <Button
        variant="outlined"
        onClick={() => onApply(trimmed)}
        disabled={busy || !trimmed || trimmed === applied}
        sx={{ textTransform: 'none', fontWeight: 700, height: 40 }}
      >
        {applied && trimmed === applied ? 'Aplicat' : 'Aplică'}
      </Button>
    </Stack>
  )
}
