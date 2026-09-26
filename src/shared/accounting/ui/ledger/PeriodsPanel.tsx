import { useState } from 'react'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { AccountingPeriod, PfaAccountingSummary } from '../../api/types'
import { EMPTY, formatDateTime, formatPeriod } from '../../format'
import { ACCOUNTING_PERIOD_STATUS } from '../../statusLabels'
import { AccountingBadge, ConfirmDialog, ErrorBlock, LoadingBlock } from '../components'
import { useNotify } from '../notify'
import { useApi } from '../useApi'

/** F6: perioadele contabile lunare, cu „Închide luna” (confirmare). O lună închisă blochează rândurile. */
export function PeriodsPanel({ summary, onChanged }: { summary: PfaAccountingSummary; onChanged: () => void }) {
  const notify = useNotify()
  const periods = useApi(() => accountingApi.periods.list(summary.id), [summary.id])
  const [closing, setClosing] = useState<AccountingPeriod | null>(null)

  const closePeriod = async (target: AccountingPeriod | null) => {
    if (!target) return
    await accountingApi.periods.close(summary.id, target.period)
    notify(`${formatPeriod(target.period)} a fost închisă.`, 'success')
    periods.reload()
    onChanged()
  }

  return (
    <Paper>
      <Stack sx={{ px: 2.5, pt: 2.5, pb: 1.5 }} spacing={0.5}>
        <Typography variant="h2">Perioade contabile</Typography>
        <Typography variant="body2" color="text.secondary">
          După închidere, tranzacțiile lunii se modifică doar prin „Corecție controlată”, cu motiv.
        </Typography>
      </Stack>
      {periods.error && <ErrorBlock message={periods.error} onRetry={periods.reload} />}
      {!periods.data && !periods.error && <LoadingBlock />}
      {periods.data && (
        <TableContainer sx={{ overflowX: 'auto', maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Luna</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Închisă</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.data.map((period) => (
                <TableRow key={period.period} hover>
                  <TableCell>
                    <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                      {period.status === 'CLOSED' && <LockRoundedIcon fontSize="inherit" color="action" aria-hidden />}
                      {formatPeriod(period.period)}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <AccountingBadge descriptor={ACCOUNTING_PERIOD_STATUS[period.status]} />
                  </TableCell>
                  <TableCell>{period.closedAt ? `${formatDateTime(period.closedAt)} · ${period.closedBy?.name ?? ''}` : EMPTY}</TableCell>
                  <TableCell align="right">
                    {period.status === 'OPEN' && !summary.readOnly && (
                      <Button size="small" onClick={() => setClosing(period)}>
                        Închide luna
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ConfirmDialog
        open={closing !== null}
        title={closing ? `Închide ${formatPeriod(closing.period)}` : ''}
        message="Tranzacțiile lunii devin blocate, iar importurile care ar cădea în ea intră la verificare, fără să modifice luna. Închiderea nu se poate anula din interfață."
        confirmLabel="Închide luna"
        onClose={() => setClosing(null)}
        onConfirm={() => closePeriod(closing)}
      />
    </Paper>
  )
}
