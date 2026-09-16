import { useState } from 'react'
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { ADMIN_STEPS } from '../../constants/adminSteps'
import type { DocumentSummary } from '../../services/document.service'
import { formatDocumentCategory } from '../../utils/formatters'
import { DocumentRow } from './DocumentRow'
import { EmptyState } from './EmptyState'
import { Section } from './Section'
import { SectionSkeleton } from './SectionSkeleton'

const statusLabels: Record<string, string> = { verified: 'Verificat', approved: 'Aprobat', pending: 'De verificat', rejected: 'Respins' }
const groupFor = (doc: DocumentSummary) => ADMIN_STEPS.find((group) => group.categories.includes(doc.category))?.key ?? 'other'

export function DocumentLibrary({ documents, loading, error, busy, openingId, downloadingId, onApprove, onReject, onOpen, onDownload }: {
  documents: DocumentSummary[]
  loading: boolean
  error: string | null
  busy: boolean
  openingId: string | null
  downloadingId: string | null
  onApprove: (doc: DocumentSummary) => void
  onReject: (doc: DocumentSummary) => void
  onOpen: (doc: DocumentSummary) => void
  onDownload: (doc: DocumentSummary) => void
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [group, setGroup] = useState('all')
  const groups = [...ADMIN_STEPS.filter((item) => item.categories.length), { key: 'other', label: 'Alte documente' }]
  const statuses = [
    { key: 'all', label: 'Toate', count: documents.length },
    { key: 'pending', label: 'De verificat', count: documents.filter((doc) => doc.status.toLowerCase() === 'pending').length },
    { key: 'verified', label: 'Aprobate', count: documents.filter((doc) => ['verified', 'approved'].includes(doc.status.toLowerCase())).length },
    { key: 'rejected', label: 'Respinse', count: documents.filter((doc) => doc.status.toLowerCase() === 'rejected').length },
  ]
  const visible = documents.filter((doc) => {
    const docStatus = doc.status.toLowerCase()
    return (status === 'all' || (status === 'verified' ? ['verified', 'approved'].includes(docStatus) : status === docStatus))
      && (group === 'all' || groupFor(doc) === group)
      && `${doc.originalFileName} ${formatDocumentCategory(doc.category)}`.toLocaleLowerCase('ro').includes(search.trim().toLocaleLowerCase('ro'))
  })
  return (
    <Stack spacing={2.5}>
      <Box><Typography variant="h2">Biblioteca de documente</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Toate fișierele clientului, organizate pe categorii. Verifică și gestionează fiecare document separat.</Typography></Box>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <Paper><SectionSkeleton rows={4} /></Paper> : <>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {statuses.map((item) => <Chip key={item.key} label={`${item.label} (${item.count})`} onClick={() => setStatus(item.key)} aria-pressed={status === item.key} variant={status === item.key ? 'filled' : 'outlined'} sx={{ height: 32, bgcolor: status === item.key ? 'primary.light' : undefined, fontWeight: status === item.key ? 650 : 450 }} />)}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Caută un document" value={search} onChange={(event) => setSearch(event.target.value)} fullWidth />
            <TextField select label="Secțiune" value={group} onChange={(event) => setGroup(event.target.value)} sx={{ minWidth: { sm: 240 } }}>
              <MenuItem value="all">Toate secțiunile</MenuItem>
              {groups.map((item) => <MenuItem key={item.key} value={item.key}>{item.label}</MenuItem>)}
            </TextField>
          </Stack>
        </Paper>
        {visible.length === 0 && <Paper sx={{ p: 3 }}><EmptyState title={documents.length ? 'Niciun document nu corespunde filtrelor.' : 'Clientul nu a încărcat încă documente.'} />{documents.length > 0 && <Button onClick={() => { setSearch(''); setStatus('all'); setGroup('all') }}>Resetează filtrele</Button>}</Paper>}
        {groups.map((item) => {
          const docs = visible.filter((doc) => groupFor(doc) === item.key)
          if (!docs.length) return null
          return <Section key={item.key} title={item.label} action={<Typography variant="caption" color="text.secondary">{docs.length} fișiere</Typography>} flush>
            {docs.map((doc) => {
              const docStatus = doc.status.toLowerCase()
              const approved = ['verified', 'approved'].includes(docStatus)
              return <DocumentRow key={doc.id} name={doc.originalFileName}
                meta={`${formatDocumentCategory(doc.category)} · ${Math.max(1, Math.round(doc.fileSize / 1024))} KB · ${new Date(doc.uploadedAtUtc).toLocaleDateString('ro-RO')}`}
                statusLabel={statusLabels[docStatus] ?? doc.status} statusTone={approved ? 'success' : docStatus === 'rejected' ? 'error' : 'warning'}
                reviewNote={docStatus === 'rejected' ? doc.reviewNote : null}
                onApprove={approved ? undefined : () => onApprove(doc)} onReject={docStatus === 'rejected' ? undefined : () => onReject(doc)}
                onOpen={() => onOpen(doc)} onDownload={() => onDownload(doc)} updatingStatus={busy} opening={openingId === doc.id} downloading={downloadingId === doc.id} />
            })}
          </Section>
        })}
      </>}
    </Stack>
  )
}
