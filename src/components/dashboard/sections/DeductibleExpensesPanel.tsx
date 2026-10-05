import { useEffect, useState } from 'react'
import { Alert, Button, Chip, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { expenseService, type DeductibleExpense } from '../../../services/expense.service'
import { documentService } from '../../../services/document.service'
import { openDocument } from '../../common/documentViewerBus'
import { AddExpenseDialog } from './accounting/AddExpenseDialog'
import { documentStatusLabel } from '../../../utils/documentStatus'
import { getErrorMessage } from '../../../utils/errorHandler'

export function DeductibleExpensesPanel({ year: propYear, month: propMonth, pfaRegistrationId, contabilContext, onSnackbar, onChanged }: {
  year?: number; month?: number; pfaRegistrationId: string | null
  contabilContext?: { userId: string; pfaRegistrationId: string }
  onSnackbar?: (message: string, severity: 'success' | 'error') => void
  onChanged?: () => void
}) {
  const now = new Date()
  const pfaId = contabilContext?.pfaRegistrationId ?? pfaRegistrationId
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [loaded, setLoaded] = useState<{ key: string; items: DeductibleExpense[]; error: string | null }>({ key: '', items: [], error: null })
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [editing, setEditing] = useState<DeductibleExpense | 'new' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [syncNotes, setSyncNotes] = useState<string[]>([])
  const actualYear = propYear ?? year, actualMonth = propMonth ?? month
  const key = `${pfaId}|${actualYear}|${actualMonth}|${revision}`
  const items = pfaId && loaded.key === key ? loaded.items : []
  const loading = Boolean(pfaId) && loaded.key !== key
  useEffect(() => {
    let cancelled = false
    if (!pfaId) return
    expenseService.getByPfa(pfaId, actualYear, actualMonth).then((data) => { if (!cancelled) setLoaded({ key, items: data, error: null }) })
      .catch((cause) => { if (!cancelled) setLoaded({ key, items: [], error: getErrorMessage(cause, 'Nu am putut încărca cheltuielile.') }) })
    return () => { cancelled = true }
  }, [pfaId, actualYear, actualMonth, key])
  const reload = () => { setRevision((value) => value + 1); onChanged?.() }
  async function review(item: DeductibleExpense, status: 'Verified' | 'Rejected') {
    setBusy(item.id)
    try { await documentService.updateStatus(item.documentId, status); reload(); onSnackbar?.('Document verificat.', 'success') }
    catch (cause) { setError(getErrorMessage(cause, 'Verificarea nu a putut fi salvată.')) }
    finally { setBusy(null) }
  }
  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
      <Typography component="h2" sx={{ fontWeight: 650 }}>Cheltuieli și documente justificative</Typography>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Button disabled={!pfaId || busy === 'sync'} onClick={async () => {
          if (!pfaId) return
          setBusy('sync'); setError(null)
          try { setSyncNotes(await expenseService.syncSources(pfaId)); reload() }
          catch (cause) { setError(getErrorMessage(cause, 'Sincronizarea a eșuat.')) }
          finally { setBusy(null) }
        }}>Sincronizează plăți și facturi ANAF</Button>
        <Button variant="contained" disabled={!pfaId} onClick={() => setEditing('new')}>Adaugă cheltuială</Button>
      </Stack>
    </Stack>
    <Alert severity="info">Poți verifica și corecta cheltuielile pe parcursul lunii. Confirmarea documentului și înregistrarea plății se fac din „Verifică / modifică”. Categoria și regulile PFA-ului stabilesc partea deductibilă din REF.</Alert>
    {propYear == null && propMonth == null && <Stack direction="row" spacing={2}>
      <TextField select label="An" value={year} onChange={(e) => setYear(Number(e.target.value))}>{[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}</TextField>
      <TextField select label="Lună" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <MenuItem key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleDateString('ro-RO', { month: 'long' })}</MenuItem>)}</TextField>
    </Stack>}
    {error && <Alert severity="error">{error}</Alert>}
    {loaded.key === key && loaded.error && <Alert severity="error">{loaded.error}</Alert>}
    {syncNotes.map((note, index) => <Alert severity="info" key={index}>{note}</Alert>)}
    {loading ? <CircularProgress size={24} /> : !items.length ? <Typography>Nu există cheltuieli pentru {actualMonth}/{actualYear}.</Typography> : items.map((item) => <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>{item.itemName}</Typography><Chip size="small" label={documentStatusLabel(item.documentStatus)} />
        </Stack>
        <Typography variant="body2">{item.supplierName ?? 'Furnizor de completat'} · {item.expenseDate ?? 'Dată de completat'} · {item.amountRon == null ? 'Sumă de completat' : `${item.amountRon.toLocaleString('ro-RO')} lei`} · {item.deductibleLabel}</Typography>
        <Typography variant="body2" color="text.secondary">{item.ledgerEntryId ? `Plată în RJIP: ${item.paymentDate ?? '—'} · ${item.paymentMethod === 'Cash' ? 'numerar' : 'bancă'} · ${item.deductibleAmount == null ? 'Deductibilitatea necesită verificare' : `Deductibil în REF: ${item.deductibleAmount.toLocaleString('ro-RO')} lei`}` : 'Document salvat; plata nu este încă asociată în RJIP. Verifică situația plății.'}</Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => openDocument(item.documentId, item.originalFileName)}>Vezi documentul</Button>
          <Button variant="outlined" onClick={() => setEditing(item)}>Verifică / modifică</Button>
          {contabilContext && <>
            <Button disabled={busy === item.id} onClick={() => setEditing(item)}>Aprobă cheltuiala</Button>
            <Button color="error" disabled={busy === item.id} onClick={() => void review(item, 'Rejected')}>Respinge</Button>
          </>}
        </Stack>
      </Stack>
    </Paper>)}
    {editing && <AddExpenseDialog pfaRegistrationId={pfaId} expense={editing === 'new' ? undefined : editing} approveDocument={Boolean(contabilContext)} onClose={() => setEditing(null)} onSaved={() => reload()} />}
  </Stack>
}
