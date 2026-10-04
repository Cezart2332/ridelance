import { useState } from 'react'
import { Alert, Button, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { clientRegistersService } from '../../../../services/clientRegisters.service'
import { formatAmount, formatDate } from '../../../../shared/accounting/format'
import { RefRowView } from '../../../../shared/accounting/ui/registers/RegistersTab'
import { downloadBlob, useApi } from '../../../../shared/accounting/ui/useApi'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { REGISTER_EXCEPTION_LABEL, REF_STATUS } from '../../../../shared/accounting/statusLabels'

export function CurrentRegisters({ kind, year }: { kind: 'rjip' | 'ref'; year: number }) {
  const rjip = useApi(() => kind === 'rjip' ? clientRegistersService.rjip(year) : Promise.resolve(null), [kind, year])
  const ref = useApi(() => kind === 'ref' ? clientRegistersService.ref(year) : Promise.resolve(null), [kind, year])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const state = kind === 'rjip' ? rjip : ref
  const exportPdf = async () => {
    setBusy(true)
    try { downloadBlob(await clientRegistersService.exportRegister(kind, year), `${kind.toUpperCase()}_${year}.pdf`); setError('') }
    catch (cause) { setError(getErrorMessage(cause)) }
    finally { setBusy(false) }
  }
  return <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
    <Stack direction="row" sx={{ p: 2, justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ fontWeight: 700 }}>Situația {year}{kind === 'ref' && ref.data ? ` · ${REF_STATUS[ref.data.status].label}` : ''}</Typography>
      <Button variant="outlined" size="small" disabled={busy || state.loading || !!state.error} onClick={() => void exportPdf()}>Descarcă PDF</Button>
    </Stack>
    {(error || state.error) && <Alert severity="error" action={state.error ? <Button onClick={state.reload}>Reîncearcă</Button> : undefined}>{error || state.error}</Alert>}
    {state.loading ? <Stack sx={{ p: 4, alignItems: 'center' }}><CircularProgress size={24} /></Stack> : !state.error && <>
      {kind === 'rjip' && rjip.data && (rjip.data.rows.length ? <TableContainer>
        <Table size="small" sx={{ minWidth: 800 }}><TableHead><TableRow>
          {['Data', 'Document / explicații', 'Încasări cash', 'Încasări bancă', 'Plăți cash', 'Plăți bancă'].map((label, index) => <TableCell key={label} align={index > 1 ? 'right' : 'left'}>{label}</TableCell>)}
        </TableRow></TableHead><TableBody>
          {rjip.data.rows.map((row, index) => <TableRow key={`${row.ledgerEntryId}-${index}`}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</TableCell>
            <TableCell>{row.document}<Typography variant="body2" color="text.secondary">{row.operation}</Typography>{row.exception && <Typography variant="caption" color="warning.main">{REGISTER_EXCEPTION_LABEL[row.exception]}</Typography>}</TableCell>
            {[row.cashIn, row.bankIn, row.cashOut, row.bankOut].map((value, col) => <TableCell key={col} align="right">{formatAmount(value)}</TableCell>)}
          </TableRow>)}
          <TableRow><TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total interval</TableCell>{(['cashIn', 'bankIn', 'cashOut', 'bankOut'] as const).map(key => <TableCell key={key} align="right" sx={{ fontWeight: 700 }}>{formatAmount(rjip.data!.monthTotals.reduce((total, item) => total + item[key], 0))}</TableCell>)}</TableRow>
        </TableBody></Table>
      </TableContainer> : <Typography color="text.secondary" sx={{ p: 2 }}>Nu există operațiuni contabile în {year}. Trimite documentele contabilului pentru verificare.</Typography>)}
      {kind === 'ref' && ref.data && <TableContainer><Table size="small"><TableHead><TableRow><TableCell /><TableCell>Element de calcul</TableCell><TableCell align="right">Valoare</TableCell></TableRow></TableHead><TableBody>
        {ref.data.rows.map(row => <RefRowView key={row.calculationElement} row={row} />)}
      </TableBody></Table></TableContainer>}
    </>}
  </Paper>
}
