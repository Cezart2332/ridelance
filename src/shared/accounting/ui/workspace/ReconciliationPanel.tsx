import { useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { MonthReconciliation, PfaAccountingSummary, ReconciliationControl, ReconciliationControlResult } from '../../api/types'
import { EXPLAINABLE_CONTROLS } from '../../api/types'
import { EMPTY, formatDate, formatMoney, formatPeriod } from '../../format'
import { LEDGER_SOURCE_LABEL, RECONCILIATION_CONTROL_LABEL, RECONCILIATION_STATUS_LABEL } from '../../statusLabels'
import { ConfirmDialog, ErrorBlock, LoadingBlock, ReasonDialog } from '../components'
import { useAccountingNav } from '../navigation'
import { useNotify } from '../notify'
import { useApi } from '../useApi'
import { Panel, StatusPill } from './parts'
import { HAIRLINE, INK, MUTED, type Cell } from './status'

const DARK = { bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', '&:hover': { bgcolor: 'var(--rl-fg-soft)' } }

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
  const [explaining, setExplaining] = useState<ReconciliationControl | null>(null)
  const [showPayouts, setShowPayouts] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const changed = (message: string) => {
    notify(message, 'success')
    reconciliation.reload()
    onChanged()
  }

  if (reconciliation.error && !reconciliation.data) return <ErrorBlock message={reconciliation.error} onRetry={reconciliation.reload} />
  if (!reconciliation.data) return <LoadingBlock />

  const month: MonthReconciliation = reconciliation.data
  const closed = month.status === 'CLOSED'
  const open = month.controls.filter((control) => control.applicable && !control.passed)
  const visible = showAll ? month.controls : open
  const okCount = month.controls.filter((control) => control.applicable && control.passed).length

  return (
    <Panel>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, py: 1.25, flexWrap: 'wrap' }}>
        <Typography component="h2" sx={{ fontSize: 14, fontWeight: 600, color: INK, flex: 1 }}>
          Închiderea lunii
        </Typography>
        {month.payouts.length > 0 && (
          <Button size="small" onClick={() => setShowPayouts(true)}>
            Payout-uri ({month.payouts.length})
          </Button>
        )}
        {closed ? (
          <>
            <StatusPill cell={{ tone: 'gray', label: 'Închisă' }} />
            {nav.role === 'Admin' && !summary.readOnly && (
              <Button size="small" onClick={() => setReopening(true)}>
                Redeschide
              </Button>
            )}
          </>
        ) : (
          !summary.readOnly && (
            <Button size="small" variant="contained" disabled={!month.canClose} onClick={() => setClosing(true)} sx={DARK}>
              Închide luna
            </Button>
          )
        )}
      </Stack>

      <Stack>
        {visible.map((control) => (
          <Stack
            key={control.control}
            direction="row"
            sx={{ gap: 1.5, px: 2, py: 1, borderTop: `1px solid ${HAIRLINE}`, alignItems: 'center' }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: INK }}>{RECONCILIATION_CONTROL_LABEL[control.control]}</Typography>
              {control.applicable && !control.passed && control.detail && (
                <Typography sx={{ fontSize: 12, color: MUTED, overflowWrap: 'anywhere' }}>{control.detail}</Typography>
              )}
            </Box>
            <Stack direction="row" sx={{ flexShrink: 0, gap: 1, alignItems: 'center' }}>
              {!closed && !control.passed && !summary.readOnly && EXPLAINABLE_CONTROLS.includes(control.control) && (
                <Button size="small" onClick={() => setExplaining(control.control)}>
                  Explică
                </Button>
              )}
              <StatusPill cell={controlCell(control)} />
            </Stack>
          </Stack>
        ))}
        <Stack direction="row" sx={{ gap: 1.5, px: 2, py: 1, borderTop: `1px solid ${HAIRLINE}`, alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontSize: 13, color: MUTED }}>
            {open.length === 0 ? 'Toate controalele sunt OK' : `${okCount} controale OK`}
          </Typography>
          <Button size="small" onClick={() => setShowAll((value) => !value)}>
            {showAll ? 'Doar problemele' : 'Toate'}
          </Button>
        </Stack>
      </Stack>

      <Dialog open={showPayouts} onClose={() => setShowPayouts(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payout-uri {formatPeriod(period)}</DialogTitle>
        <DialogContent>
        <TableContainer sx={{ overflowX: 'auto' }}>
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
        </DialogContent>
      </Dialog>

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
        open={explaining !== null}
        title={explaining ? RECONCILIATION_CONTROL_LABEL[explaining] : ''}
        reasonLabel="Explicație"
        onClose={() => setExplaining(null)}
        onSubmit={async (note) => {
          if (!explaining) return
          await accountingApi.periods.explain(summary.id, period, explaining, note)
          changed('Explicația a fost salvată.')
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
