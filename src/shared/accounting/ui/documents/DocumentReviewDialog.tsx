import { useEffect, useState } from 'react'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { accountingApi } from '../../api/accountingApi'
import type { ExtractedFieldKey, ExtractedFields, PlatformDocumentDetail } from '../../api/types'
import { EMPTY, formatAmount, formatDate, formatDateTime, formatMoney, formatPeriod, parseAmount } from '../../format'
import {
  DECLARATION_STATUS,
  DOCUMENT_CHECK_LABEL,
  PLATFORM_DOCUMENT_STATUS,
  PLATFORM_DOCUMENT_TYPE_LABEL,
  PLATFORM_LABEL,
} from '../../statusLabels'
import { AccountingBadge, ErrorBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useAction } from '../notify'
import { POLL_INTERVAL_MS, useApi } from '../useApi'
import { PdfViewer } from './PdfViewer'
import { normalizeForSearch } from './search'

type EditableKey = Exclude<ExtractedFieldKey, 'otherAmounts'>

interface FieldSpec {
  key: EditableKey
  label: string
  kind: 'text' | 'date' | 'amount'
}

function fieldSpecs(detail: PlatformDocumentDetail): FieldSpec[] {
  const report = detail.documentType === 'PLATFORM_REPORT'
  return [
    { key: 'supplierName', label: 'Furnizor', kind: 'text' },
    { key: 'supplierVatId', label: 'Cod TVA', kind: 'text' },
    { key: 'supplierCountry', label: 'Țară', kind: 'text' },
    ...(report ? [] : [{ key: 'invoiceNumber', label: 'Nr. factură', kind: 'text' } as const]),
    { key: 'invoiceDate', label: report ? 'Data raportului' : 'Data facturii', kind: 'date' },
    { key: 'periodFrom', label: 'Perioada de la', kind: 'date' },
    { key: 'periodTo', label: 'Perioada până la', kind: 'date' },
    { key: 'currency', label: 'Monedă', kind: 'text' },
    { key: 'commissionAmount', label: 'Comision', kind: 'amount' },
    { key: 'amount', label: report ? 'Venituri din curse' : 'Total factură', kind: 'amount' },
  ]
}

function displayValue(spec: FieldSpec, fields: ExtractedFields): string {
  const value = fields[spec.key]
  if (value === null || value === undefined || value === '') return EMPTY
  if (spec.kind === 'date') return formatDate(String(value))
  if (spec.kind === 'amount') return formatMoney(Number(value), fields.currency)
  return String(value)
}

function draftValue(spec: FieldSpec, fields: ExtractedFields): string {
  const value = fields[spec.key]
  if (value === null || value === undefined) return ''
  return spec.kind === 'amount' ? formatAmount(Number(value)) : String(value)
}

/**
 * F2: ecranul de verificare. Stânga, PDF-ul original; dreapta, ce a citit RIDElance, verificările
 * și acțiunile. Hover sau focus pe un câmp evidențiază fragmentul sursă în PDF.
 */
export function DocumentReviewDialog({
  documentId,
  readOnly,
  onClose,
  onChanged,
}: {
  documentId: string
  readOnly: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const nav = useAccountingNav()
  const { busy, run } = useAction()
  const detail = useApi(() => accountingApi.documents.get(documentId), [documentId])
  const file = useApi(() => accountingApi.documents.getFile(documentId), [documentId])
  const [activeField, setActiveField] = useState<EditableKey | null>(null)
  const [pdfText, setPdfText] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<Record<EditableKey, string>>>({})
  const [reason, setReason] = useState('')

  const doc = detail.data
  const reloadDetail = detail.reload

  // Documentul încă se citește: întrebăm din nou până apare rezultatul.
  useEffect(() => {
    if (doc?.status !== 'EXTRACTING' && doc?.status !== 'UPLOADED') return
    const timer = window.setTimeout(reloadDetail, POLL_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [doc, reloadDetail])

  const extraction = doc?.extraction ?? null
  const specs = doc ? fieldSpecs(doc) : []
  const snippets = extraction?.sourceSnippets ?? {}
  const locked = doc?.status === 'LOCKED'
  const canEdit = !readOnly && !locked && extraction !== null && doc?.status !== 'EXTRACTING'
  const failedChecks = doc?.checks.filter((check) => !check.passed) ?? []
  const canConfirm = !readOnly && doc?.status === 'PENDING_CONFIRMATION' && failedChecks.length === 0

  const snippetFound = (key: EditableKey) => {
    const snippet = snippets[key]
    if (!snippet || pdfText === null) return true
    return pdfText.includes(normalizeForSearch(snippet))
  }

  const startEditing = () => {
    if (!extraction) return
    setDraft(Object.fromEntries(specs.map((spec) => [spec.key, draftValue(spec, extraction.fields)])))
    setReason('')
    setEditing(true)
  }

  const changes = (): { fields: Partial<ExtractedFields>; invalid: string[] } => {
    const fields: Partial<Record<EditableKey, string | number | null>> = {}
    const invalid: string[] = []
    if (!extraction) return { fields: {}, invalid }
    for (const spec of specs) {
      const text = (draft[spec.key] ?? '').trim()
      if (text === draftValue(spec, extraction.fields)) continue
      if (spec.kind === 'amount') {
        const amount = text === '' ? null : parseAmount(text)
        if (text !== '' && amount === null) invalid.push(spec.label)
        else fields[spec.key] = amount
      } else {
        fields[spec.key] = text === '' ? null : spec.key === 'supplierVatId' || spec.key === 'supplierCountry' || spec.key === 'currency' ? text.toUpperCase() : text
      }
    }
    return { fields: fields as Partial<ExtractedFields>, invalid }
  }

  const pending = editing ? changes() : { fields: {}, invalid: [] }
  const hasChanges = Object.keys(pending.fields).length > 0

  const save = () =>
    run(
      'save',
      async () => {
        await accountingApi.documents.updateExtraction(documentId, { fields: pending.fields, reason: reason.trim() })
        setEditing(false)
        reloadDetail()
        onChanged()
      },
      'Modificările au fost salvate; verificările au fost refăcute.',
    )

  const confirm = () =>
    run(
      'confirm',
      async () => {
        await accountingApi.documents.confirm(documentId)
        reloadDetail()
        onChanged()
      },
      'Document confirmat.',
    )

  const title = doc
    ? `${PLATFORM_DOCUMENT_TYPE_LABEL[doc.documentType]}${doc.platform ? ` ${PLATFORM_LABEL[doc.platform]}` : ''} · ${formatPeriod(doc.period)}`
    : 'Document'

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="xl" fullWidth slotProps={{ paper: { sx: { height: fullScreen ? undefined : '92vh' } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {doc?.fileName}
          </Typography>
        </Box>
        {doc && <AccountingBadge descriptor={PLATFORM_DOCUMENT_STATUS[doc.status]} />}
        <IconButton onClick={onClose} aria-label="Închide">
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      {detail.error && !doc && (
        <Box sx={{ p: 3 }}>
          <ErrorBlock message={detail.error} onRetry={detail.reload} />
        </Box>
      )}

      {doc && (
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ flex: 1, minHeight: 0, overflow: { xs: 'auto', md: 'hidden' } }}>
          <Box sx={{ flex: { md: 1.3 }, minHeight: { xs: 420, md: 0 }, display: 'flex', flexDirection: 'column', borderRight: { md: 1 }, borderColor: { md: 'divider' } }}>
            {file.data ? (
              <PdfViewer file={file.data} highlight={activeField ? (snippets[activeField] ?? null) : null} onText={(text) => setPdfText(normalizeForSearch(text))} />
            ) : file.error ? (
              <Box sx={{ p: 3 }}>
                <ErrorBlock message={file.error} onRetry={file.reload} />
              </Box>
            ) : (
              <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Stack>
            )}
          </Box>

          <Box sx={{ width: { md: 440 }, flexShrink: 0, overflowY: { md: 'auto' }, p: 3 }}>
            <Stack spacing={2.5}>
              {locked && doc.lockedReason && <Alert severity="info">Document blocat: {doc.lockedReason}</Alert>}
              {doc.status === 'EXTRACTING' && (
                <Alert severity="info" icon={<CircularProgress size={18} />}>
                  RIDElance citește documentul…
                </Alert>
              )}
              {doc.status === 'EXTRACTION_FAILED' && <Alert severity="error">{doc.extractionError ?? 'Citirea a eșuat.'}</Alert>}

              {extraction && (
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="subtitle2">RIDElance a citit documentul:</Typography>
                    {extraction.modelConfidence !== null && (
                      <Typography variant="caption" color="text.secondary">
                        Încredere {Math.round(extraction.modelConfidence * 100)}%
                      </Typography>
                    )}
                  </Stack>
                  {specs.map((spec) => {
                    const manual = extraction.manuallyEditedFields.includes(spec.key)
                    const found = snippetFound(spec.key)
                    return (
                      <Box
                        key={spec.key}
                        tabIndex={editing ? -1 : 0}
                        onMouseEnter={() => setActiveField(spec.key)}
                        onMouseLeave={() => setActiveField(null)}
                        onFocus={() => setActiveField(spec.key)}
                        onBlur={() => setActiveField(null)}
                        sx={{
                          px: 1.25,
                          py: 0.75,
                          mx: -1.25,
                          borderRadius: 1,
                          outline: 'none',
                          bgcolor: activeField === spec.key ? 'grey.100' : 'transparent',
                          '&:focus-visible': { boxShadow: `0 0 0 2px ${theme.palette.primary.main}` },
                        }}
                      >
                        {editing ? (
                          <TextField
                            label={spec.label}
                            type={spec.kind === 'date' ? 'date' : 'text'}
                            value={draft[spec.key] ?? ''}
                            onChange={(event) => setDraft((current) => ({ ...current, [spec.key]: event.target.value }))}
                            fullWidth
                            error={pending.invalid.includes(spec.label)}
                            helperText={pending.invalid.includes(spec.label) ? 'Sumă invalidă' : undefined}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        ) : (
                          <Stack direction="row" sx={{ gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                              <Typography variant="caption" color="text.secondary">
                                {spec.label}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                                {displayValue(spec, extraction.fields)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" sx={{ gap: 0.5, flexShrink: 0 }}>
                              {manual && <Chip size="small" label="modificat manual" />}
                              {!found && !manual && (
                                <Tooltip title="Fragmentul sursă nu a fost găsit în PDF.">
                                  <Chip size="small" icon={<SearchOffRoundedIcon />} label="sursă negăsită" color="warning" variant="outlined" />
                                </Tooltip>
                              )}
                            </Stack>
                          </Stack>
                        )}
                      </Box>
                    )
                  })}
                  {extraction.fields.otherAmounts.length > 0 && !editing && (
                    <Typography variant="body2" color="text.secondary">
                      Alte sume: {extraction.fields.otherAmounts.map((item) => `${item.label} ${formatMoney(item.amount, extraction.fields.currency)}`).join(' · ')}
                    </Typography>
                  )}
                </Stack>
              )}

              {editing && (
                <TextField
                  label="Motivul modificării (obligatoriu)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
              )}

              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                {editing ? (
                  <>
                    <Button
                      variant="contained"
                      disabled={!hasChanges || !reason.trim() || pending.invalid.length > 0 || busy !== null}
                      onClick={save}
                    >
                      {busy === 'save' ? 'Se salvează…' : 'Salvează'}
                    </Button>
                    <Button onClick={() => setEditing(false)} disabled={busy !== null}>
                      Renunță
                    </Button>
                  </>
                ) : (
                  <>
                    <Tooltip title={failedChecks.length > 0 ? 'Rezolvă întâi verificările picate.' : ''}>
                      <span>
                        <Button variant="contained" disabled={!canConfirm || busy !== null} onClick={confirm}>
                          {busy === 'confirm' ? 'Se confirmă…' : 'Confirmă'}
                        </Button>
                      </span>
                    </Tooltip>
                    {canEdit && (
                      <Button variant="outlined" onClick={startEditing}>
                        Modifică
                      </Button>
                    )}
                  </>
                )}
              </Stack>

              {doc.checks.length > 0 && (
                <>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Verificări</Typography>
                    {doc.checks.map((check) => (
                      <Stack key={check.code} direction="row" sx={{ gap: 1, alignItems: 'flex-start' }}>
                        {check.passed ? (
                          <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'success.main', mt: 0.25 }} aria-label="Trecută" />
                        ) : (
                          <CancelRoundedIcon fontSize="small" sx={{ color: 'error.main', mt: 0.25 }} aria-label="Picată" />
                        )}
                        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {DOCUMENT_CHECK_LABEL[check.code]}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {check.message}
                          </Typography>
                          {check.action === 'ADD_SUPPLIER' && !check.passed && (
                            <Box>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  nav.openRules({
                                    vatId: extraction?.fields.supplierVatId ?? undefined,
                                    country: extraction?.fields.supplierCountry ?? undefined,
                                    supplierName: extraction?.fields.supplierName ?? undefined,
                                  })
                                }
                              >
                                Adaugă în registrul de furnizori
                              </Button>
                            </Box>
                          )}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}

              <Divider />
              <Stack spacing={1}>
                <Typography variant="subtitle2">Inclus în</Typography>
                {doc.includedIn.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Încă în nicio declarație.
                  </Typography>
                ) : (
                  doc.includedIn.map((item) => (
                    <Stack key={item.versionId} direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link
                        component="button"
                        type="button"
                        variant="body2"
                        onClick={() => nav.openPfa(doc.pfaId, 'declaratii', { luna: item.period })}
                      >
                        {item.type} · {formatPeriod(item.period)} · v{item.versionNo}
                        {item.kind === 'RECTIFICATIVE' ? ' (rectificativă)' : ''}
                      </Link>
                      <AccountingBadge descriptor={DECLARATION_STATUS[item.status]} />
                    </Stack>
                  ))
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Încărcat de {doc.uploadedBy.name} la {formatDateTime(doc.uploadedAt)}
                {doc.reviewedBy && ` · confirmat de ${doc.reviewedBy.name} la ${formatDateTime(doc.reviewedAt)}`}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      )}
    </Dialog>
  )
}
