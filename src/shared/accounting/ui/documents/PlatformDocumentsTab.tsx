import { useEffect, useRef, useState, type DragEvent } from 'react'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import { accountingApi } from '../../api/accountingApi'
import { isAccountingApiError } from '../../api/errors'
import type { Platform, PlatformDocumentListItem, PlatformDocumentType } from '../../api/types'
import { EMPTY, formatDateTime, formatMoney, formatPeriod } from '../../format'
import { PLATFORM_DOCUMENT_STATUS, PLATFORM_DOCUMENT_TYPE_LABEL, PLATFORM_LABEL } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useAction, useNotify } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { errorMessage, POLL_INTERVAL_MS, useApi } from '../useApi'
import { DocumentReviewDialog } from './DocumentReviewDialog'

const SLOT_TYPES: { type: Exclude<PlatformDocumentType, 'UNKNOWN'>; label: string }[] = [
  { type: 'COMMISSION_INVOICE', label: 'Factură comision' },
  { type: 'PLATFORM_REPORT', label: 'Raport venituri' },
]

interface UploadIssue {
  fileName: string
  message: string
  existingDocumentId: string | null
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/** F2: documentele Uber/Bolt ale unei luni — sloturi, încărcare, verificare, confirmare în bloc. */
export function PlatformDocumentsTab({ summary, onSummaryChanged }: DossierTabProps) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const { busy, run } = useAction()
  const readOnly = summary.readOnly
  const period = nav.period ?? summary.currentPeriod
  const periods = useApi(() => accountingApi.periods.list(summary.id), [summary.id])
  const documents = useApi(() => accountingApi.documents.list(summary.id, period), [summary.id, period])
  const [selected, setSelected] = useState<string[]>([])
  const [issues, setIssues] = useState<UploadIssue[]>([])
  const [skipped, setSkipped] = useState<{ id: string; reason: string }[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const list = documents.data ?? []
  const reloadDocuments = documents.reload
  const reading = list.some((document) => document.status === 'EXTRACTING')

  // Documentele în citire se reîmprospătează singure până ies din `EXTRACTING`; la final se
  // reîncarcă și antetul, fiindcă citirea poate schimba statusul lunii.
  const wasReading = useRef(false)
  useEffect(() => {
    if (wasReading.current && !reading) onSummaryChanged()
    wasReading.current = reading
    if (!reading) return
    const timer = window.setTimeout(reloadDocuments, POLL_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [reading, documents.data, reloadDocuments, onSummaryChanged])

  const changed = () => {
    reloadDocuments()
    onSummaryChanged()
  }

  const upload = async (files: File[]) => {
    const found: UploadIssue[] = []
    const pdfs = files.filter((file) => {
      if (isPdf(file)) return true
      found.push({ fileName: file.name, message: 'Doar fișiere PDF.', existingDocumentId: null })
      return false
    })
    setUploading((current) => current + pdfs.length)
    await Promise.all(
      pdfs.map(async (file) => {
        try {
          await accountingApi.documents.upload(summary.id, { file, period })
        } catch (error) {
          const existing = isAccountingApiError(error) ? error.details?.existingDocumentId : null
          found.push({ fileName: file.name, message: errorMessage(error), existingDocumentId: typeof existing === 'string' ? existing : null })
        } finally {
          setUploading((current) => current - 1)
        }
      }),
    )
    setIssues(found)
    const accepted = pdfs.filter((file) => !found.some((issue) => issue.fileName === file.name)).length
    if (accepted > 0) notify(accepted === 1 ? 'Documentul se citește…' : `${accepted} documente se citesc…`, 'info')
    changed()
  }

  const pending = list.filter((document) => document.status === 'PENDING_CONFIRMATION')
  const selectedPending = selected.filter((id) => pending.some((document) => document.id === id))

  const confirmSelected = () =>
    run('bulk', async () => {
      const result = await accountingApi.documents.confirmBulk({ ids: selectedPending })
      setSkipped(result.skipped)
      setSelected([])
      notify(result.confirmed.length === 1 ? 'Un document confirmat.' : `${result.confirmed.length} documente confirmate.`, 'success')
      changed()
    })

  const slotDocument = (platform: Platform, type: PlatformDocumentType) =>
    list.find((document) => document.platform === platform && document.documentType === type)
  const unclassified = list.filter((document) => !document.platform || document.documentType === 'UNKNOWN')

  const openDocument = (id: string) => nav.setParam('document', id)

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (readOnly) return
    void upload([...event.dataTransfer.files])
  }

  const periodOptions = (periods.data ?? []).map((item) => item.period)
  if (!periodOptions.includes(period)) periodOptions.unshift(period)

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <TextField select label="Luna" value={period} onChange={(event) => nav.setParam('luna', event.target.value)} sx={{ minWidth: 220 }}>
          {periodOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {formatPeriod(option)}
            </MenuItem>
          ))}
        </TextField>
        {!readOnly && pending.length > 0 && (
          <Button variant="contained" disabled={selectedPending.length === 0 || busy !== null} onClick={confirmSelected}>
            {busy === 'bulk' ? 'Se confirmă…' : `Confirmă selectate${selectedPending.length ? ` (${selectedPending.length})` : ''}`}
          </Button>
        )}
      </Stack>

      {documents.error && <ErrorBlock message={documents.error} onRetry={documents.reload} />}

      {/* Sloturile așteptate: câte o factură și un raport pe platformă. */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        {summary.platforms.flatMap((platform) =>
          SLOT_TYPES.map(({ type, label }) => {
            const document = slotDocument(platform, type)
            return (
              <Paper key={`${platform}-${type}`} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, borderColor: document ? 'divider' : 'warning.dark' }}>
                <Typography variant="subtitle2">
                  {label} {PLATFORM_LABEL[platform]}
                </Typography>
                {document ? (
                  <>
                    <AccountingBadge descriptor={PLATFORM_DOCUMENT_STATUS[document.status]} />
                    <Typography variant="body2">{formatMoney(document.mainAmount, document.currency)}</Typography>
                    <Box sx={{ mt: 'auto', pt: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => openDocument(document.id)}>
                        {document.status === 'NEEDS_REVIEW' || document.status === 'PENDING_CONFIRMATION' ? 'Verifică' : 'Deschide'}
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                      Lipsește
                    </Typography>
                    {!readOnly && (
                      <Box sx={{ mt: 'auto', pt: 1 }}>
                        <Button size="small" variant="outlined" startIcon={<CloudUploadRoundedIcon />} onClick={() => inputRef.current?.click()}>
                          Încarcă PDF
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            )
          }),
        )}
      </Box>

      {!readOnly && (
        <Box
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          sx={(theme) => ({
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            bgcolor: dragging ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
            p: 3,
            textAlign: 'center',
          })}
        >
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <CloudUploadRoundedIcon color="action" />
            <Typography variant="body2">
              Trage aici facturile și rapoartele Uber/Bolt (PDF, mai multe deodată). Tipul documentului îl recunoaște RIDElance.
            </Typography>
            <Button variant="outlined" size="small" onClick={() => inputRef.current?.click()} disabled={uploading > 0}>
              {uploading > 0 ? `Se încarcă ${uploading}…` : 'Alege fișiere'}
            </Button>
          </Stack>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(event) => {
              const files = [...(event.target.files ?? [])]
              event.target.value = ''
              if (files.length) void upload(files)
            }}
          />
        </Box>
      )}

      {issues.length > 0 && (
        <Alert severity="warning" onClose={() => setIssues([])}>
          <Stack spacing={0.5}>
            {issues.map((issue) => (
              <Box key={issue.fileName}>
                <strong>{issue.fileName}</strong>: {issue.message}{' '}
                {issue.existingDocumentId && (
                  <Button size="small" onClick={() => openDocument(issue.existingDocumentId!)}>
                    Deschide documentul existent
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        </Alert>
      )}

      {skipped.length > 0 && (
        <Alert severity="info" onClose={() => setSkipped([])}>
          Nu s-au confirmat {skipped.length}: {skipped.map((item) => item.reason).join(' · ')}
        </Alert>
      )}

      <Paper>
        {!documents.data && !documents.error && <LoadingBlock />}
        {documents.data && list.length === 0 && (
          <Stack sx={{ px: 2.5 }}>
            <EmptyText>Niciun document încărcat pentru {formatPeriod(period)}.</EmptyText>
          </Stack>
        )}
        {list.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {!readOnly && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        disabled={pending.length === 0}
                        checked={pending.length > 0 && selectedPending.length === pending.length}
                        indeterminate={selectedPending.length > 0 && selectedPending.length < pending.length}
                        onChange={(event) => setSelected(event.target.checked ? pending.map((document) => document.id) : [])}
                        slotProps={{ input: { 'aria-label': 'Selectează documentele de confirmat' } }}
                      />
                    </TableCell>
                  )}
                  <TableCell>Document</TableCell>
                  <TableCell align="right">Sumă</TableCell>
                  <TableCell>Verificări</TableCell>
                  <TableCell>Încărcat</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((document: PlatformDocumentListItem) => {
                  const selectable = document.status === 'PENDING_CONFIRMATION'
                  return (
                    <TableRow key={document.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDocument(document.id)}>
                      {!readOnly && (
                        <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            disabled={!selectable}
                            checked={selected.includes(document.id)}
                            onChange={(event) =>
                              setSelected((current) => (event.target.checked ? [...current, document.id] : current.filter((id) => id !== document.id)))
                            }
                            slotProps={{ input: { 'aria-label': `Selectează ${document.fileName}` } }}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                          {document.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {PLATFORM_DOCUMENT_TYPE_LABEL[document.documentType]}
                          {document.platform ? ` ${PLATFORM_LABEL[document.platform]}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {formatMoney(document.mainAmount, document.currency)}
                      </TableCell>
                      <TableCell>
                        {document.mainAmount === null && document.failedChecks === 0
                          ? EMPTY
                          : document.failedChecks > 0
                            ? `${document.failedChecks} ${document.failedChecks === 1 ? 'picată' : 'picate'}`
                            : 'Toate trecute'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(document.uploadedAt)}</TableCell>
                      <TableCell>
                        <AccountingBadge descriptor={PLATFORM_DOCUMENT_STATUS[document.status]} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      {unclassified.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Documentele fără tip primesc tipul după citire (procesarea lunii sau încărcarea).
        </Typography>
      )}

      {nav.documentId && (
        <DocumentReviewDialog
          key={nav.documentId}
          documentId={nav.documentId}
          readOnly={readOnly}
          onClose={() => nav.setParam('document', null)}
          onChanged={changed}
        />
      )}
    </Stack>
  )
}
