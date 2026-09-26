import { Paper, Stack, Typography } from '@mui/material'

import type { CashRegisterState, PfaAccountingSummary } from '../../api/types'
import { formatDate } from '../../format'
import { CASH_REGISTER_STATUS } from '../../statusLabels'
import { AccountingBadge, Fact } from '../components'

/** Casa de marcat (read-only până la F7, când vine fluxul de activare). */
export function CashSection({ cash }: { summary: PfaAccountingSummary; cash: CashRegisterState; onChanged: () => void }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Typography variant="h2">Numerar și casa de marcat</Typography>
        <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap' }}>
          <Fact label="Status">
            <AccountingBadge descriptor={CASH_REGISTER_STATUS[cash.status]} />
          </Fact>
          <Fact label="Data activării">{formatDate(cash.activationDate)}</Fact>
          <Fact label="Verificat de">{cash.verifiedBy?.name ?? '—'}</Fact>
        </Stack>
      </Stack>
    </Paper>
  )
}
