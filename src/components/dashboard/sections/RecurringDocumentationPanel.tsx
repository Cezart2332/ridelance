import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'

import {
  RECURRING_DOCUMENTATION_ITEMS,
  recurringItemUsesExpenseUpload,
} from '../../../constants/recurringDocumentationItems'
import { documentService, type DocumentSummary } from '../../../services/document.service'
import { documentStatusColors, documentStatusLabel, normalizeDocumentStatus } from '../../../utils/documentStatus'
import { isUploadedInRomaniaMonth } from '../../../utils/romaniaMonth'
import { formatMonthLabelRomania } from '../../../constants/recurringDocumentationNotification'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

type RecurringDocumentationPanelProps = {
  year?: number
  month?: number
  /** When set, contabil can upload/verify for this client */
  contabilContext?: {
    userId: string
    pfaRegistrationId: string
    onDocumentsChange?: () => void
  }
  onUploadSuccess?: () => void
  onSnackbar?: (message: string, severity: 'success' | 'error') => void
}

export function RecurringDocumentationPanel({
  year,
  month,
  contabilContext,
  onUploadSuccess,
  onSnackbar,
}: RecurringDocumentationPanelProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const isContabil = Boolean(contabilContext)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const docs = isContabil
        ? await documentService.getByUser(contabilContext!.userId)
        : await documentService.getByUser()
      setDocuments(docs)
    } catch {
      onSnackbar?.('Nu s-au putut încărca documentele.', 'error')
    } finally {
      setLoading(false)
    }
  }, [isContabil, contabilContext, onSnackbar])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const targetDate = useMemo(() => {
    if (year !== undefined && month !== undefined) {
      return new Date(Date.UTC(year, month - 1, 15))
    }
    return new Date()
  }, [year, month])

  const docsByCategory = useMemo(() => {
    const map = new Map<string, DocumentSummary>()
    for (const doc of documents) {
      if (!isUploadedInRomaniaMonth(doc.uploadedAtUtc, targetDate)) continue
      const existing = map.get(doc.category)
      if (!existing || new Date(doc.uploadedAtUtc) > new Date(existing.uploadedAtUtc)) {
        map.set(doc.category, doc)
      }
    }
    return map
  }, [documents, targetDate])

  const handleUpload = async (category: string, file: File, itemLabel: string) => {
    setUploadingCategory(category)
    try {
      const ext = file.name.split('.').pop()
      const safeLabel = itemLabel.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80)
      const namedFile = new File([file], `${safeLabel}.${ext}`, { type: file.type })

      if (isContabil) {
        await documentService.upload(
          namedFile,
          category,
          contabilContext!.pfaRegistrationId,
          contabilContext!.userId,
        )
      } else {
        await documentService.upload(namedFile, category)
      }

      await loadDocuments()
      onUploadSuccess?.()
      contabilContext?.onDocumentsChange?.()
      onSnackbar?.('Document încărcat cu succes.', 'success')
    } catch {
      onSnackbar?.('Încărcarea documentului a eșuat.', 'error')
    } finally {
      setUploadingCategory(null)
    }
  }

  const handleDownload = async (doc: DocumentSummary) => {
    setDownloadingId(doc.id)
    try {
      await documentService.downloadAndSave(doc.id, doc.originalFileName)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleStatus = async (id: string, status: 'Verified' | 'Rejected') => {
    setStatusUpdatingId(id)
    try {
      await documentService.updateStatus(id, status)
      await loadDocuments()
      contabilContext?.onDocumentsChange?.()
      onSnackbar?.(status === 'Verified' ? 'Document aprobat.' : 'Document respins.', 'success')
    } catch {
      onSnackbar?.('Actualizarea statusului a eșuat.', 'error')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const monthLabel = useMemo(() => {
    if (year !== undefined && month !== undefined) {
      const target = new Date(Date.UTC(year, month - 1, 15))
      const formatter = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' })
      const raw = formatter.format(target)
      return raw.charAt(0).toUpperCase() + raw.slice(1)
    }
    return formatMonthLabelRomania()
  }, [year, month])

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
        Documentație lunară — {monthLabel}
      </Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.7, fontSize: '0.9rem', mb: 2 }}>
        {isContabil
          ? 'Vizualizează documentele încărcate de client pentru luna selectată.'
          : 'Încarcă documentele obligatorii pentru închiderea lunii. Notificarea din prima zi a lunii te reamintește.'}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
        </Box>
      ) : (
        <Stack spacing={1.2}>
          {RECURRING_DOCUMENTATION_ITEMS.map((item) => {
            if (recurringItemUsesExpenseUpload(item)) {
              const expenseDocs = documents.filter(
                (d) =>
                  d.category === 'Cheltuiala' && isUploadedInRomaniaMonth(d.uploadedAtUtc, targetDate),
              )
              const fulfilled = expenseDocs.length > 0
              const statusStyle = fulfilled
                ? documentStatusColors('Verified')
                : { color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) }

              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                    bgcolor: DASHBOARD_TOKENS.surface,
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.3 }}>
                        {fulfilled
                          ? `${expenseDocs.length} factură/facturi în luna curentă — secțiunea Cheltuieli`
                          : 'Adaugă facturile în secțiunea Cheltuieli deductibile'}
                      </Typography>
                    </Box>
                    <Chip
                      label={fulfilled ? `${expenseDocs.length} încărcate` : 'Lipsă'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        color: statusStyle.color,
                        bgcolor: statusStyle.bg,
                        borderRadius: DASHBOARD_TOKENS.radius.full,
                      }}
                    />
                  </Stack>
                </Paper>
              )
            }

            const doc = docsByCategory.get(item.category)
            const status = doc ? normalizeDocumentStatus(doc.status) : null
            const statusStyle = doc
              ? documentStatusColors(doc.status)
              : { color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) }

            return (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${status === 'verified' ? alpha('#2e7d32', 0.2) : DASHBOARD_TOKENS.border}`,
                  bgcolor: DASHBOARD_TOKENS.surface,
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                      {item.label}
                    </Typography>
                    <Chip
                      label={doc ? documentStatusLabel(doc.status) : 'Lipsă'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        color: statusStyle.color,
                        bgcolor: statusStyle.bg,
                        borderRadius: DASHBOARD_TOKENS.radius.full,
                      }}
                    />
                  </Stack>

                  {doc && (
                    <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }} noWrap>
                      {doc.originalFileName} ·{' '}
                      {new Date(doc.uploadedAtUtc).toLocaleDateString('ro-RO')}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {!isContabil && (
                      <Button
                        variant="contained"
                        component="label"
                        size="small"
                        disabled={uploadingCategory === item.category}
                        startIcon={
                          uploadingCategory === item.category ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <UploadRoundedIcon sx={{ fontSize: 18 }} />
                          )
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: DASHBOARD_TOKENS.radius.full,
                          bgcolor: DASHBOARD_TOKENS.primary,
                          boxShadow: 'none',
                          '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong },
                        }}
                      >
                        {doc ? 'Reîncarcă' : 'Încarcă'}
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) void handleUpload(item.category, file, item.label)
                            e.target.value = ''
                          }}
                        />
                      </Button>
                    )}

                    {doc && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            setOpeningId(doc.id)
                            try {
                              await documentService.openInNewTab(doc.id, doc.originalFileName)
                            } finally {
                              setOpeningId(null)
                            }
                          }}
                          disabled={openingId === doc.id}
                          startIcon={
                            openingId === doc.id ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                            )
                          }
                          sx={{
                            textTransform: 'none',
                            borderRadius: DASHBOARD_TOKENS.radius.full,
                            boxShadow: 'none',
                          }}
                        >
                          Deschide
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          startIcon={
                            downloadingId === doc.id ? (
                              <CircularProgress size={14} />
                            ) : (
                              <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
                            )
                          }
                          sx={{ textTransform: 'none', borderRadius: DASHBOARD_TOKENS.radius.full }}
                        >
                          Descarcă
                        </Button>
                        {isContabil && normalizeDocumentStatus(doc.status) === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleStatus(doc.id, 'Verified')}
                              disabled={statusUpdatingId === doc.id}
                              sx={{ color: '#10b981' }}
                              title="Aprobă"
                            >
                              <CheckCircleRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleStatus(doc.id, 'Rejected')}
                              disabled={statusUpdatingId === doc.id}
                              sx={{ color: '#ef4444' }}
                              title="Respinge"
                            >
                              <CancelRoundedIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}

      {!loading && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: DASHBOARD_TOKENS.radius.md, fontSize: '0.85rem' }}>
          Documentele marcate „Verificat” au fost validate de contabil. La începutul fiecărei luni primești o
          notificare pentru a reîncărca documentația.
        </Alert>
      )}
    </Paper>
  )
}
