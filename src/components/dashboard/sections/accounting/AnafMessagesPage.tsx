import { useState } from 'react'
import { Alert, Button, Chip, CircularProgress, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { PageHeader } from '../../ui'
import { clientAnafService } from '../../../../services/clientAnaf.service'
import { downloadBlob, openBlob, useApi } from '../../../../shared/accounting/ui/useApi'
import { formatDateTime, formatMoney } from '../../../../shared/accounting/format'
import { SPV_MESSAGE_CELL, SPV_REQUEST_CELL, spvTypeLabel } from '../../../../shared/accounting/ui/workspace/spv'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { PFA_PATHS } from '../../../../config/pfaNavigation'

const INVOICE_KIND = { RECEIVED: 'Primită', SENT: 'Trimisă', ERROR: 'Eroare', BUYER_MESSAGE: 'Mesaj cumpărător', OTHER: 'Alt mesaj' }
const PAYMENT = { UNPAID: 'Neplătită', PARTIALLY_PAID: 'Plătită parțial', PAID: 'Plătită' }

export function AnafMessagesPage() {
  const [section, setSection] = useState<'spv' | 'efactura'>('spv')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const spv = useApi(clientAnafService.spv, [])
  const efactura = useApi(clientAnafService.efactura, [])
  const state = section === 'spv' ? spv : efactura
  const find = (value: string) => value.toLocaleLowerCase('ro').includes(search.trim().toLocaleLowerCase('ro'))
  const messages = (spv.data?.messages ?? []).filter(message => find(`${spvTypeLabel(message.type)} ${message.details ?? ''}`))
  const invoices = (efactura.data?.messages ?? []).filter(message => find(`${message.invoiceNumber ?? ''} ${message.supplierName ?? ''} ${message.customerName ?? ''} ${message.details ?? ''}`))
  const file = async (id: string, kind: 'spv' | 'xml' | 'pdf') => {
    setBusy(id); setError('')
    try {
      const blob = kind === 'spv' ? await clientAnafService.spvFile(id) : await clientAnafService.invoiceFile(id, kind)
      if (kind === 'pdf') openBlob(blob)
      else {
        const extension = kind !== 'spv' ? kind : blob.type.includes('pdf') ? 'pdf' : blob.type.includes('xml') ? 'xml' : blob.type.includes('zip') ? 'zip' : 'bin'
        downloadBlob(blob, `${kind === 'spv' ? 'SPV' : 'eFactura'}_${id}.${extension}`)
      }
    } catch (cause) { setError(getErrorMessage(cause, 'Documentul nu poate fi deschis.')) }
    finally { setBusy(null) }
  }
  return <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
    <PageHeader title="SPV și e-Factura" subtitle="Mesajele și documentele PFA-ului tău, aduse în aplicație de contabilitate." />
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Tabs value={section} onChange={(_, next: 'spv' | 'efactura') => { setSection(next); setSearch('') }} aria-label="Documente ANAF" variant="fullWidth">
        <Tab value="spv" label="Mesaje SPV" /><Tab value="efactura" label="e-Factura" />
      </Tabs>
      <Stack spacing={1} sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">{section === 'spv' ? 'SPV conține comunicările ANAF, documentele și răspunsurile la cererile trimise de contabil. Conectarea și solicitările se gestionează de contabilitate.' : 'Aici vezi facturile primite și trimise prin ANAF, precum și erorile sau mesajele asociate. Facturile emise prin Oblio rămân disponibile și în „Facturi”.'}</Typography>
        <Typography variant="body2" color="text.secondary">Pentru un document lipsă sau o conexiune oprită, scrie contabilului. Această pagină afișează datele deja sincronizate în RIDElance.</Typography>
        <Button href={PFA_PATHS.accountantChat} size="small" sx={{ alignSelf: 'flex-start' }}>Scrie contabilului</Button>
        {section === 'efactura' && efactura.data && <Typography variant="body2">Conexiune PFA: {efactura.data.link?.status === 'ACTIVE' ? 'activă' : efactura.data.link?.status === 'NO_ACCESS' ? 'fără acces — verificare necesară' : 'neconectată sau oprită'} · Ultima sincronizare: {efactura.data.link?.lastSyncAtUtc ? formatDateTime(efactura.data.link.lastSyncAtUtc) : 'nu există încă'}</Typography>}
      </Stack>
    </Paper>
    <TextField label="Caută mesaj sau factură" size="small" value={search} onChange={event => setSearch(event.target.value)} />
    {(error || state.error) && <Alert severity="error" action={state.error ? <Button onClick={state.reload}>Reîncearcă</Button> : undefined}>{error || state.error}</Alert>}
    {state.loading ? <Stack sx={{ alignItems: 'center', py: 4 }}><CircularProgress size={24} /></Stack> : !state.error && <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {section === 'spv' && messages.map(message => <Stack key={message.id} spacing={1} sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}><Typography sx={{ fontWeight: 700 }}>{spvTypeLabel(message.type)}</Typography><Chip size="small" variant="outlined" label={SPV_MESSAGE_CELL[message.status]?.label ?? 'În verificare'} /></Stack>
        <Typography variant="caption" color="text.secondary">{formatDateTime(message.createdAtUtc)}</Typography>
        {message.details && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{message.details}</Typography>}
        {message.note && <Typography variant="body2" color="text.secondary">{message.note}</Typography>}
        {message.hasDocument && <Button disabled={busy !== null} sx={{ alignSelf: 'flex-start' }} onClick={() => void file(message.id, 'spv')}>Descarcă documentul SPV</Button>}
      </Stack>)}
      {section === 'efactura' && invoices.map(message => <Stack key={message.id} spacing={1} sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}><Typography sx={{ fontWeight: 700 }}>{message.invoiceNumber ?? 'Mesaj e-Factura'}</Typography><Chip size="small" variant="outlined" label={INVOICE_KIND[message.kind]} /></Stack>
        <Typography variant="body2">{message.supplierName ?? message.supplierCif ?? 'Furnizor neprecizat'} → {message.customerName ?? message.customerCif ?? 'Client neprecizat'}</Typography>
        <Typography variant="body2" color="text.secondary">{formatDateTime(message.createdAtUtc)}{message.totalAmount != null ? ` · ${formatMoney(message.totalAmount, message.currency ?? 'RON')}` : ''}{message.paymentStatus ? ` · ${PAYMENT[message.paymentStatus]}` : ''}</Typography>
        {message.details && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{message.details}</Typography>}
        {message.downloadError && <Alert severity="warning">{message.downloadError}</Alert>}
        {message.downloaded && <Stack direction="row" spacing={1}><Button disabled={busy !== null} onClick={() => void file(message.id, 'pdf')}>Vezi PDF</Button><Button disabled={busy !== null} onClick={() => void file(message.id, 'xml')}>Descarcă XML</Button></Stack>}
      </Stack>)}
      {(section === 'spv' ? !messages.length : !invoices.length) && <Typography color="text.secondary" sx={{ p: 3 }}>{search ? 'Niciun rezultat pentru căutarea aleasă.' : section === 'spv' ? 'Nu există mesaje SPV sincronizate pentru PFA-ul tău.' : 'Nu există mesaje e-Factura sincronizate pentru PFA-ul tău.'}</Typography>}
    </Paper>}
    {section === 'spv' && !!spv.data?.requests.length && <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}><Typography sx={{ fontWeight: 700, mb: 1 }}>Cererile contabilului către SPV</Typography>{spv.data.requests.map(request => <Stack key={request.id} direction="row" sx={{ py: 1, justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}><Typography variant="body2">{spvTypeLabel(request.type)} · {formatDateTime(request.createdAtUtc)}</Typography><Typography variant="body2">{SPV_REQUEST_CELL[request.status]?.label ?? request.status}{request.error ? ` · ${request.error}` : ''}</Typography></Stack>)}</Paper>}
  </Stack>
}
