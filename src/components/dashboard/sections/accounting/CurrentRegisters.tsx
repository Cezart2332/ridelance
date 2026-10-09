import { useState } from 'react'
import { Alert, Button, CircularProgress, IconButton, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { clientRegistersService } from '../../../../services/clientRegisters.service'
import { formatAmount, formatDate } from '../../../../shared/accounting/format'
import { RefRowView } from '../../../../shared/accounting/ui/registers/RegistersTab'
import { downloadBlob, useApi } from '../../../../shared/accounting/ui/useApi'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { REGISTER_EXCEPTION_LABEL, REF_STATUS } from '../../../../shared/accounting/statusLabels'

type Draft = { date: string; documentLabel: string; description: string; direction: 'INCOME' | 'EXPENSE'; channel: 'BANK' | 'CASH'; amount: string }

const emptyDraft = (): Draft => ({ date: new Date().toISOString().slice(0, 10), documentLabel: '', description: '', direction: 'INCOME', channel: 'BANK', amount: '' })

/**
 * Formularul PFAlone: titularul își trece singur încasările și plățile în registrul de încasări și
 * plăți. Nimic nu se completează automat; REF-ul și D212 se calculează din ce trece aici.
 */
function EntryForm({ onSaved }: { onSaved: () => void }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const amount = Number(draft.amount.replace(/\s/g, '').replace(',', '.'))
  const valid = draft.date && draft.documentLabel.trim() && draft.description.trim() && Number.isFinite(amount) && amount > 0
  const set = (patch: Partial<Draft>) => setDraft((previous) => ({ ...previous, ...patch }))

  const save = async () => {
    setBusy(true)
    try {
      await clientRegistersService.addEntry({
        date: draft.date,
        documentLabel: draft.documentLabel.trim(),
        counterparty: null,
        description: draft.description.trim(),
        transactionType: draft.direction,
        paymentMethod: draft.channel,
        amount,
        category: null,
      })
      setDraft(emptyDraft())
      setError('')
      onSaved()
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return <Stack spacing={1} sx={{ p: 2, pt: 0 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1, alignItems: { md: 'center' } }}>
      <TextField size="small" type="date" label="Data" value={draft.date} onChange={(e) => set({ date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField size="small" label="Document" value={draft.documentLabel} onChange={(e) => set({ documentLabel: e.target.value })} />
      <TextField size="small" label="Explicație" value={draft.description} onChange={(e) => set({ description: e.target.value })} sx={{ flex: 1 }} />
      <TextField size="small" select label="Tip" value={draft.direction} onChange={(e) => set({ direction: e.target.value as Draft['direction'] })} sx={{ minWidth: 120 }}>
        <MenuItem value="INCOME">Încasare</MenuItem>
        <MenuItem value="EXPENSE">Plată</MenuItem>
      </TextField>
      <TextField size="small" select label="Canal" value={draft.channel} onChange={(e) => set({ channel: e.target.value as Draft['channel'] })} sx={{ minWidth: 120 }}>
        <MenuItem value="BANK">Bancă</MenuItem>
        <MenuItem value="CASH">Numerar</MenuItem>
      </TextField>
      <TextField size="small" label="Sumă (lei)" value={draft.amount} onChange={(e) => set({ amount: e.target.value })} sx={{ width: 130 }} />
      <Button variant="contained" disabled={!valid || busy} onClick={() => void save()}>Adaugă</Button>
    </Stack>
    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
  </Stack>
}

export function CurrentRegisters({ kind, year }: { kind: 'rjip' | 'ref'; year: number }) {
  const rjip = useApi(() => kind === 'rjip' ? clientRegistersService.rjip(year) : Promise.resolve(null), [kind, year])
  const ref = useApi(() => kind === 'ref' ? clientRegistersService.ref(year) : Promise.resolve(null), [kind, year])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const state = kind === 'rjip' ? rjip : ref
  const remove = async (id: string) => {
    setBusy(true)
    try { await clientRegistersService.deleteEntry(id); setError(''); rjip.reload() }
    catch (cause) { setError(getErrorMessage(cause)) }
    finally { setBusy(false) }
  }
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
    {kind === 'rjip' && <EntryForm onSaved={rjip.reload} />}
    {(error || state.error) && <Alert severity="error" action={state.error ? <Button onClick={state.reload}>Reîncearcă</Button> : undefined}>{error || state.error}</Alert>}
    {state.loading ? <Stack sx={{ p: 4, alignItems: 'center' }}><CircularProgress size={24} /></Stack> : !state.error && <>
      {kind === 'rjip' && rjip.data && (rjip.data.rows.length ? <TableContainer>
        <Table size="small" sx={{ minWidth: 800 }}><TableHead><TableRow>
          {['Data', 'Document / explicații', 'Încasări cash', 'Încasări bancă', 'Plăți cash', 'Plăți bancă'].map((label, index) => <TableCell key={label} align={index > 1 ? 'right' : 'left'}>{label}</TableCell>)}
          <TableCell />
        </TableRow></TableHead><TableBody>
          {rjip.data.rows.map((row, index) => <TableRow key={`${row.ledgerEntryId}-${index}`}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</TableCell>
            <TableCell>{row.document}<Typography variant="body2" color="text.secondary">{row.operation}</Typography>{row.exception && <Typography variant="caption" color="warning.main">{REGISTER_EXCEPTION_LABEL[row.exception]}</Typography>}</TableCell>
            {[row.cashIn, row.bankIn, row.cashOut, row.bankOut].map((value, col) => <TableCell key={col} align="right">{formatAmount(value)}</TableCell>)}
            <TableCell align="right"><IconButton size="small" aria-label="Șterge" disabled={busy} onClick={() => void remove(row.ledgerEntryId)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></TableCell>
          </TableRow>)}
          <TableRow><TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total interval</TableCell>{(['cashIn', 'bankIn', 'cashOut', 'bankOut'] as const).map(key => <TableCell key={key} align="right" sx={{ fontWeight: 700 }}>{formatAmount(rjip.data!.monthTotals.reduce((total, item) => total + item[key], 0))}</TableCell>)}<TableCell /></TableRow>
        </TableBody></Table>
      </TableContainer> : <Typography color="text.secondary" sx={{ p: 2 }}>Nicio înregistrare în {year}.</Typography>)}
      {kind === 'ref' && ref.data && <TableContainer><Table size="small"><TableHead><TableRow><TableCell /><TableCell>Element de calcul</TableCell><TableCell align="right">Valoare</TableCell></TableRow></TableHead><TableBody>
        {ref.data.rows.map(row => <RefRowView key={row.calculationElement} row={row} />)}
      </TableBody></Table></TableContainer>}
    </>}
  </Paper>
}
