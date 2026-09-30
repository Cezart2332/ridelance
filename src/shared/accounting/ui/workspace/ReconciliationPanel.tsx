import { useState } from 'react'
import { Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { MonthReconciliation, PfaAccountingSummary, ReconciliationControlResult } from '../../api/types'
import { EMPTY, formatDate, formatMoney, formatPeriod } from '../../format'
import { LEDGER_SOURCE_LABEL, RECONCILIATION_CONTROL_LABEL, RECONCILIATION_STATUS_LABEL } from '../../statusLabels'
import { ConfirmDialog, ErrorBlock, LoadingBlock, ReasonDialog } from '../components'
import { useAccountingNav } from '../navigation'
import { useNotify } from '../notify'
import { useApi } from '../useApi'
import { Panel, StatusPill } from './parts'
import { HAIRLINE, INK, MUTED, type Cell } from './status'

const DARK = { bgcolor: INK, color: '#FFFFFF', '&:hover': { bgcolor: '#2d2d45' } }

function controlCell(control: ReconciliationControlResult): Cell {
  if (!control.applicable) return { tone: 'gray', label: 'Nu e cazul' }
  return control.passed ? { tone: 'green', label: 'OK' } : { tone: 'red', label: 'De rezolvat' }
}

/**
 * Reconcilierea lunii (spec flux contabil §8): controalele surselor, payout-urile cu descompunerea lor,
 * „Închide luna” doar cu toate controalele trecute, și redeschiderea (doar ADMIN, cu motiv).
 */
export function ReconciliationPanel({ summary, period, onChanged }: { summary: PfaAccountingSummary; period: string; onChanged: () => void }) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const reconciliation = useApi(() => accountingApi.periods.reconciliation(summary.id, period), [summary.id, period])
  const [closing, setClosing] = useState(false)
  const [reopening, setReopening] = useState(false)

  const changed = (message: string) => {
    notify(message, 'success')
    reconciliation.reload()
    onChanged()
  }

  if (reconciliation.error && !reconciliation.data) return <ErrorBlock message={reconciliation.error} onRetry={reconciliation.reload} />
  if (!reconciliation.data) return <LoadingBlock />

  const month: MonthReconciliation = reconciliation.data
  const closed = month.status === 'CLOSED'
  const failing = month.controls.filter((control) => !control.passed).length

  return (
    <Panel sx={{ px: 2.5, py: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK, flex: 1 }}>
          Reconciliere {formatPeriod(period)}
        </Typography>
        {closed ? (
          <>
            <StatusPill cell={{ tone: 'gray', label: 'Luna e închisă' }} />
            {nav.role === 'Admin' && !summary.readOnly && (
              <Button size="small" onClick={() => setReopening(true)}>
                Redeschide
              </Button>
            )}
          </>
        ) : (
          !summary.readOnly && (
            <Button variant="contained" disabled={!month.canClose} onClick={() => setClosing(true)} sx={DARK}>
              Închide luna
            </Button>
          )
        )}
      </Stack>

      {!closed && failing > 0 && (
        <Typography sx={{ fontSize: 13, color: MUTED, mb: 1 }}>
          {failing === 1 ? 'Un control de rezolvat' : `${failing} controale de rezolvat`}
        </Typography>
      )}

      <Stack sx={{ borderTop: `1px solid ${HAIRLINE}` }}>
        {month.controls.map((control) => (
          <Stack
            key={control.control}
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ gap: { xs: 0.5, sm: 2 }, py: 1.25, borderBottom: `1px solid ${HAIRLINE}`, alignItems: { sm: 'center' } }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>{RECONCILIATION_CONTROL_LABEL[control.control]}</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED, overflowWrap: 'anywhere' }}>{control.detail}</Typography>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <StatusPill cell={controlCell(control)} />
            </Box>
          </Stack>
        ))}
      </Stack>

      {month.payouts.length > 0 && (
        <TableContainer sx={{ mt: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Payout</TableCell>
                <TableCell align="right">Virat</TableCell>
                <TableCell align="right">Venit brut</TableCell>
                <TableCell align="right">Comision</TableCell>
                <TableCell align="right">Diferență</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {month.payouts.map((payout) => (
                <TableRow key={payout.bankTransactionId}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {LEDGER_SOURCE_LABEL[payout.platform]} · {formatDate(payout.date)}
                  </TableCell>
                  <TableCell align="right">{formatMoney(payout.payout, 'RON')}</TableCell>
                  <TableCell align="right">{payout.gross === null ? EMPTY : formatMoney(payout.gross, 'RON')}</TableCell>
                  <TableCell align="right">{payout.commission === null ? EMPTY : formatMoney(payout.commission, 'RON')}</TableCell>
                  <TableCell align="right">{payout.difference === null ? EMPTY : formatMoney(payout.difference, 'RON')}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{RECONCILIATION_STATUS_LABEL[payout.status]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={closing}
        title={`Închide ${formatPeriod(period)}`}
        message="Tranzacțiile lunii se blochează și se salvează registrele lunii (RJIP și REF). O lună închisă o poate redeschide doar un administrator, cu motiv."
        confirmLabel="Închide luna"
        onClose={() => setClosing(false)}
        onConfirm={async () => {
          await accountingApi.periods.close(summary.id, period)
          changed(`${formatPeriod(period)} a fost închisă.`)
        }}
      />
      <ReasonDialog
        open={reopening}
        title={`Redeschide ${formatPeriod(period)}`}
        reasonLabel="Motivul redeschiderii"
        confirmLabel="Redeschide"
        destructive
        onClose={() => setReopening(false)}
        onSubmit={async (reason) => {
          await accountingApi.periods.reopen(summary.id, period, reason)
          changed(`${formatPeriod(period)} a fost redeschisă.`)
        }}
      />
    </Panel>
  )
}
