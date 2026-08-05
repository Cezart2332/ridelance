import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { isEmptyValue } from './emptyValue'

export interface FieldSpec {
  label: string
  /** Gol, null sau textele-substitut vechi („Nu se aplică") devin „—". */
  value?: string | null
  /** Identificatori numerici (CUI, CNP, CAEN): cifre de lățime egală, ca să se poată compara. */
  numeric?: boolean
}

/**
 * O pereche etichetă/valoare. Fără bordură și fără fundal: un câmp nu e un obiect de sine
 * stătător, e o linie de text cu un capăt mai discret.
 */
export function Field({ label, value, numeric, action }: FieldSpec & { action?: ReactNode }) {
  const empty = isEmptyValue(value)

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Typography
          variant="body1"
          color={empty ? 'text.disabled' : 'text.primary'}
          sx={{
            wordBreak: 'break-word',
            ...(numeric ? { fontVariantNumeric: 'tabular-nums' } : {}),
          }}
        >
          {empty ? '—' : value}
        </Typography>
        {action}
      </Stack>
    </Stack>
  )
}
