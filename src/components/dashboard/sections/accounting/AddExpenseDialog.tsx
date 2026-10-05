import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { expenseService, type DeductibleExpense, type ExpenseSuggestion } from '../../../../services/expense.service'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { openDocument } from '../../../common/documentViewerBus'

type Payment = '' | 'Cash' | 'Bank' | 'Unpaid'

/** The same review form for the PFA and accountant: document, classification, actual payment. */
export function AddExpenseDialog({ pfaRegistrationId, expense, approveDocument = false, onClose, onSaved }: {
  pfaRegistrationId: string | null
  expense?: DeductibleExpense
  approveDocument?: boolean
  onClose: () => void
  onSaved: (expense: DeductibleExpense) => void
}) {
  const [draft, setDraft] = useState<DeductibleExpense | null>(expense ?? null)
  const [suggestion, setSuggestion] = useState<ExpenseSuggestion | null>(null)
  const [loading, setLoading] = useState(Boolean(expense))
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [supplier, setSupplier] = useState(expense?.supplierName ?? '')
  const [date, setDate] = useState(expense?.expenseDate ?? '')
  const [amount, setAmount] = useState(expense?.amountRon?.toString() ?? '')
  const [vat, setVat] = useState(expense?.vatAmount?.toString() ?? '')
  const [category, setCategory] = useState('')
  const [documentType, setDocumentType] = useState(expense?.documentTypeLabel ?? '')
  const [number, setNumber] = useState('')
  const [personal, setPersonal] = useState('0')
  const [payment, setPayment] = useState<Payment>('')
  const [paidOn, setPaidOn] = useState('')
  const [bankId, setBankId] = useState('')
  const [reason, setReason] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const alive = useRef(true)
  const touched = useRef(new Set<string>())
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  function edit(key: string, setter: Dispatch<SetStateAction<string>>, value: string) {
    touched.current.add(key); setter(value)
  }

  function apply(read: ExpenseSuggestion, preserve = false) {
    setSuggestion(read)
    const put = (key: string, setter: Dispatch<SetStateAction<string>>, value: string) => {
      if (!preserve || !touched.current.has(key)) setter(value)
    }
    put('supplier', setSupplier, read.supplierName ?? '')
    put('date', setDate, read.date ?? '')
    put('amount', setAmount, read.total?.toString() ?? '')
    put('vat', setVat, read.vat?.toString() ?? '')
    put('category', setCategory, read.category ?? '')
    put('type', setDocumentType, read.documentType ?? '')
    put('number', setNumber, read.number ?? '')
    put('personal', setPersonal, read.personalAmount.toString())
    if (!preserve || !touched.current.has('payment')) setPayment(read.paymentMethod === 'Cash' || read.paymentMethod === 'Bank' ? read.paymentMethod : '')
    put('paidOn', setPaidOn, read.paymentDate ?? read.date ?? '')
    put('bankId', setBankId, read.paymentMethod === 'Bank' ? read.ledgerEntryId ?? '' : '')
  }

  useEffect(() => {
    if (!expense || !pfaRegistrationId) return
    let cancelled = false
    expenseService.getSuggestion(pfaRegistrationId, expense.id).then((read) => {
      if (!cancelled) apply(read)
    }).catch((cause) => { if (!cancelled) setError(getErrorMessage(cause, 'Nu am putut încărca datele cheltuielii.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [expense, pfaRegistrationId])

  async function upload(file: File) {
    if (!pfaRegistrationId) return
    setLoading(true); setError(null)
    try {
      const now = new Date()
      const created = await expenseService.createForPfa(pfaRegistrationId, {
        catalogCategory: 'Nedefinit', itemName: file.name, deductibleLabel: 'De clasificat',
        year: now.getFullYear(), month: now.getMonth() + 1, file,
      })
      if (!alive.current) return
      setDraft(created)
      let read = await expenseService.getSuggestion(pfaRegistrationId, created.id)
      if (!alive.current) return
      apply(read, true)
      setLoading(false); setReading(!read.ready)
      for (let attempt = 0; !read.ready && attempt < 12 && alive.current; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        if (!alive.current) return
        read = await expenseService.getSuggestion(pfaRegistrationId, created.id)
      }
      if (!alive.current) return
      apply(read, true)
      if (!read.ready || !read.category) setNotice('Verifică datele citite. Completează manual câmpurile pe care nu le-am putut identifica.')
    } catch (cause) {
      if (alive.current) setError(getErrorMessage(cause, 'Încărcarea sau citirea documentului a eșuat.'))
    } finally { if (alive.current) { setLoading(false); setReading(false) } }
  }

  const chosen = suggestion?.categories.find((item) => item.category === category)
  const numeric = (value: string) => Number(value.trim().replace(',', '.'))
  const canSave = Boolean(draft && suggestion && category && date && amount.trim() && payment &&
    (payment === 'Unpaid' || (paidOn && (payment !== 'Bank' || bankId))) &&
    (!suggestion.ledgerEntryId || reason.trim())) && !loading && !saving

  async function save() {
    if (!pfaRegistrationId || !draft || !chosen || !canSave || !payment) return
    const total = numeric(amount), privatePart = numeric(personal), tax = vat.trim() ? numeric(vat) : null
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(privatePart) || privatePart < 0 || privatePart > total ||
      (tax !== null && (!Number.isFinite(tax) || tax < 0 || tax > total))) {
      setError('Verifică suma totală, TVA-ul și partea personală.'); return
    }
    setSaving(true); setError(null)
    try {
      const [year, month] = date.split('-').map(Number)
      const saved = await expenseService.updateForPfa(pfaRegistrationId, draft.id, {
        catalogCategory: category, itemName: chosen.label, deductibleLabel: 'Calculat din regulile PFA',
        amountRon: total, year, month, expenseDate: date, supplierName: supplier || null,
        vatAmount: tax, documentTypeLabel: documentType || null, confirm: true,
        paymentMethod: payment, paymentDate: payment === 'Unpaid' ? null : paidOn,
        ledgerEntryId: payment === 'Bank' ? bankId : null, accountingCategory: category,
        personalAmount: privatePart, documentNumber: number || null, reason: reason || undefined, approveDocument,
      })
      onSaved(saved); onClose()
    } catch (cause) { setError(getErrorMessage(cause, 'Cheltuiala nu a putut fi confirmată.')) }
    finally { setSaving(false) }
  }

  return <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose}>
    <DialogTitle>{expense ? 'Verifică și modifică cheltuiala' : 'Adaugă cheltuială'}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="info">{notice}</Alert>}
      {loading && <Stack direction="row" spacing={2}><CircularProgress size={24} /><Typography>Citim documentul și propunem categoria…</Typography></Stack>}
      {reading && <Alert severity="info">Documentul se citește în fundal. Poți completa formularul; datele scrise de tine vor fi păstrate.</Alert>}
      {!draft && <>
        <Typography>Încarcă bonul sau factura. Citim datele și propunem categoria; regulile PFA-ului stabilesc deductibilitatea.</Typography>
        <input ref={input} type="file" hidden accept="image/*,application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = '' }} />
        <Button variant="contained" disabled={loading || !pfaRegistrationId} onClick={() => input.current?.click()}>Alege document</Button>
      </>}
      {draft && !loading && <>
        <Button onClick={() => openDocument(draft.documentId, draft.originalFileName)}>Deschide documentul</Button>
        <TextField label="Furnizor" value={supplier} onChange={(e) => edit('supplier', setSupplier, e.target.value)} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField fullWidth label="Data documentului" type="date" value={date} onChange={(e) => edit('date', setDate, e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth label="Număr document" value={number} onChange={(e) => edit('number', setNumber, e.target.value)} />
        </Stack>
        <TextField label="Tip document" value={documentType} onChange={(e) => edit('type', setDocumentType, e.target.value)} />
        <TextField select label="Categorie contabilă" value={category} onChange={(e) => edit('category', setCategory, e.target.value)}>
          <MenuItem value="">Alege categoria</MenuItem>
          {suggestion?.categories.map((item) => <MenuItem key={item.category} value={item.category}>{item.label}</MenuItem>)}
        </TextField>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField fullWidth label="Total plătit / de plată (lei)" value={amount} onChange={(e) => edit('amount', setAmount, e.target.value)} />
          <TextField fullWidth label="TVA înscris pe document (lei)" value={vat} onChange={(e) => edit('vat', setVat, e.target.value)} />
        </Stack>
        <TextField label="Articole personale, nedeductibile (lei)" value={personal} onChange={(e) => edit('personal', setPersonal, e.target.value)} helperText="Cafeaua, alimentele și alte cumpărături personale nu se includ în combustibil." />
        {chosen && <Alert severity="info">Deductibilitate propusă: {chosen.percent == null ? 'necesită verificare / amortizare' : `${chosen.percent}% din partea pentru activitate`}. Se recalculează la data plății după regulile PFA-ului.</Alert>}
        {suggestion?.currency && suggestion.currency !== 'RON' && <Alert severity="warning">Document în valută: plata necesită conversie și verificare contabilă.</Alert>}
        <TextField select label="Cum a fost plătită?" value={payment} onChange={(e) => { touched.current.add('payment'); setPayment(e.target.value as Payment); edit('bankId', setBankId, '') }}>
          <MenuItem value="">Alege situația plății</MenuItem><MenuItem value="Cash">Numerar</MenuItem>
          <MenuItem value="Bank">Card / transfer bancar din OpenBanking</MenuItem><MenuItem value="Unpaid">Factură încă neplătită</MenuItem>
        </TextField>
        {payment === 'Bank' && <>
          <Button disabled={saving || loading} onClick={async () => {
            if (!pfaRegistrationId || !draft) return
            setSaving(true); setError(null)
            try {
              const notes = await expenseService.syncSources(pfaRegistrationId)
              const read = await expenseService.getSuggestion(pfaRegistrationId, draft.id, numeric(amount))
              setSuggestion(read); setNotice(notes.join(' '))
            } catch (cause) { setError(getErrorMessage(cause, 'Nu am putut actualiza plățile și facturile.')) }
            finally { setSaving(false) }
          }}>Actualizează plățile și facturile ANAF</Button>
          <TextField select label="Plata din bancă" value={bankId} onChange={(e) => { const item = suggestion?.payments.find((p) => p.id === e.target.value); edit('bankId', setBankId, e.target.value); if (item) edit('paidOn', setPaidOn, item.date) }}>
            <MenuItem value="">Selectează tranzacția existentă</MenuItem>
            {suggestion?.payments.map((item) => <MenuItem key={item.id} value={item.id}>{item.date} · {item.amount} lei · {item.description}</MenuItem>)}
          </TextField>
          {!suggestion?.payments.length && <Alert severity="info">Nu există o plată disponibilă cu suma documentului. Sincronizează banca sau verifică suma; documentul rămâne salvat pentru verificare.</Alert>}
        </>}
        {payment && payment !== 'Unpaid' && <TextField label="Data plății" type="date" value={paidOn} disabled={payment === 'Bank'} onChange={(e) => edit('paidOn', setPaidOn, e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />}
        {payment === 'Unpaid' && <Alert severity="info">Factura rămâne în lista de documente. În RJIP și REF intră după înregistrarea plății.</Alert>}
        {suggestion?.ledgerEntryId && <TextField required label="Motivul corecției" value={reason} onChange={(e) => setReason(e.target.value)} />}
      </>}
    </Stack></DialogContent>
    <DialogActions><Button disabled={saving} onClick={onClose}>Închide</Button><Button variant="contained" disabled={!canSave} onClick={() => void save()}>{saving ? 'Se salvează…' : approveDocument ? 'Aprobă cheltuiala și plata' : 'Confirmă cheltuiala și plata'}</Button></DialogActions>
  </Dialog>
}
