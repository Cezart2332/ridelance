import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, Typography, Snackbar, Alert, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { documentService } from '../../../services/document.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { formatDocumentCategory } from '../../../utils/formatters'

interface DocumentSummary {
  id: string;
  originalFileName: string;
  contentType: string;
  category: string;
  status: string;
  fileSize: number;
  uploadedAtUtc: string;
  expiresAtUtc?: string | null;
}

const DOCUMENT_CATEGORIES = [
  'Buletin',
  'AtestatSofer',
  'CazierJudiciar',
  'AdeverintaMedicala',
  'ITP',
  'RCA',
  'Other',
] as const

// Categories that require an expiry date when uploading
const EXPIRABLE_CATEGORIES = new Set(['Buletin', 'AsigurareCalatori', 'ITP', 'RCA', 'PermisConducere'])

function statusChipSx(status: string) {
  const s = status.toLowerCase()
  if (s === 'approved' || s === 'verified') {
    return { borderColor: alpha('#2e7d32', 0.2), color: '#2e7d32', backgroundColor: alpha('#2e7d32', 0.08) }
  }
  if (s === 'pending') {
    return { borderColor: alpha('#ed6c02', 0.2), color: '#b54708', backgroundColor: alpha('#ed6c02', 0.1) }
  }
  return { borderColor: alpha('#d32f2f', 0.2), color: '#b71c1c', backgroundColor: alpha('#d32f2f', 0.08) }
}

function statusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'approved' || s === 'verified') return 'Valid'
  if (s === 'pending') return 'In verificare'
  return 'Respins'
}

type ExpiryState = 'valid' | 'soon30' | 'soon7' | 'expired'

function getExpiryState(expiresAtUtc: string | null | undefined): ExpiryState | null {
  if (!expiresAtUtc) return null
  const expiry = new Date(expiresAtUtc)
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'soon7'
  if (diffDays <= 30) return 'soon30'
  return 'valid'
}

function ExpiryBadge({ expiresAtUtc }: { expiresAtUtc?: string | null }) {
  const state = getExpiryState(expiresAtUtc)
  if (!state) return null

  const expiry = new Date(expiresAtUtc!)
  const formatted = expiry.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (state === 'expired') {
    return (
      <Tooltip title={`Expirat la ${formatted}`}>
        <Chip
          icon={<ErrorRoundedIcon sx={{ fontSize: '14px !important' }} />}
          label="Expirat"
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: alpha('#ef4444', 0.1), color: '#dc2626', border: `1px solid ${alpha('#ef4444', 0.2)}` }}
        />
      </Tooltip>
    )
  }
  if (state === 'soon7') {
    return (
      <Tooltip title={`Expiră la ${formatted}`}>
        <Chip
          icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
          label={`Exp. ${formatted}`}
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: alpha('#ef4444', 0.08), color: '#dc2626', border: `1px solid ${alpha('#ef4444', 0.15)}` }}
        />
      </Tooltip>
    )
  }
  if (state === 'soon30') {
    return (
      <Tooltip title={`Expiră la ${formatted}`}>
        <Chip
          icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
          label={`Exp. ${formatted}`}
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: alpha('#f59e0b', 0.1), color: '#b45309', border: `1px solid ${alpha('#f59e0b', 0.2)}` }}
        />
      </Tooltip>
    )
  }
  return (
    <Tooltip title={`Expiră la ${formatted}`}>
      <Chip
        icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
        label={`Exp. ${formatted}`}
        size="small"
        sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: alpha('#10b981', 0.08), color: '#059669', border: `1px solid ${alpha('#10b981', 0.2)}` }}
      />
    </Tooltip>
  )
}

export function DocumentsTab() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'error' })

  // Pending expiry date input state: category -> date string
  const [pendingExpiry, setPendingExpiry] = useState<Record<string, string>>({})
  // Pending file waiting for expiry confirmation: category -> File
  const [pendingFile, setPendingFile] = useState<Record<string, File>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchDocuments = () => {
    documentService.getByUser()
      .then(setDocuments)
      .catch((err) => {
        console.error(err)
        setSnackbar({ open: true, message: 'Documentele tale nu au putut fi încărcate. Verifică conexiunea.', severity: 'error' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const docsByCategory = useMemo(() => {
    const map = new Map<string, DocumentSummary>()
    for (const doc of documents) {
      const existing = map.get(doc.category)
      if (!existing || new Date(doc.uploadedAtUtc) > new Date(existing.uploadedAtUtc)) {
        map.set(doc.category, doc)
      }
    }
    return map
  }, [documents])

  const otherDocuments = useMemo(
    () => documents.filter((doc) => !DOCUMENT_CATEGORIES.includes(doc.category as typeof DOCUMENT_CATEGORIES[number])),
    [documents],
  )

  const handleFileSelected = (file: File, category: string) => {
    if (EXPIRABLE_CATEGORIES.has(category)) {
      // Hold the file and ask for expiry date
      setPendingFile((prev) => ({ ...prev, [category]: file }))
      setPendingExpiry((prev) => ({ ...prev, [category]: '' }))
    } else {
      void handleUpload(file, category)
    }
  }

  const handleUpload = async (file: File, category: string, expiresAt?: string) => {
    setUploading(category)
    try {
      await documentService.upload(file, category, undefined, undefined, expiresAt)
      setSnackbar({ open: true, message: `Documentul "${formatDocumentCategory(category)}" a fost încărcat cu succes!`, severity: 'success' })
      fetchDocuments()
      // Clear pending state
      setPendingFile((prev) => { const n = { ...prev }; delete n[category]; return n })
      setPendingExpiry((prev) => { const n = { ...prev }; delete n[category]; return n })
    } catch (err: unknown) {
      console.error('Upload failed:', err)
      setSnackbar({ open: true, message: getErrorMessage(err, `Încărcarea documentului "${formatDocumentCategory(category)}" a eșuat.`), severity: 'error' })
    } finally {
      setUploading(null)
    }
  }

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const blob = await documentService.download(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      console.error('Download failed:', err)
      setSnackbar({ open: true, message: getErrorMessage(err, 'Descărcarea documentului a eșuat. Te rugăm să încerci din nou.'), severity: 'error' })
    }
  }

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <CircularProgress size={32} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(280px, 1fr))' }, gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2 }}>
          Documentele mele
        </Typography>
        <Stack spacing={1.4}>
          {DOCUMENT_CATEGORIES.map((category) => {
            const doc = docsByCategory.get(category)
            const isUploading = uploading === category
            const isExpirable = EXPIRABLE_CATEGORIES.has(category)
            const hasPendingFile = !!pendingFile[category]

            return (
              <Paper
                key={category}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${hasPendingFile ? alpha(DASHBOARD_TOKENS.primary, 0.35) : DASHBOARD_TOKENS.border}`,
                  backgroundColor: hasPendingFile ? alpha(DASHBOARD_TOKENS.primary, 0.03) : DASHBOARD_TOKENS.surface,
                  transition: 'all 0.2s',
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}>
                  <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>
                      {formatDocumentCategory(category)}
                    </Typography>
                    {doc ? (
                      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem', mt: 0.3 }}>
                        (incarcat) · {doc.originalFileName}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.8rem', mt: 0.3 }}>
                        Neincarcat
                      </Typography>
                    )}
                  </div>
                  <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexShrink: 0 }}>
                    {doc && (
                      <>
                        <ExpiryBadge expiresAtUtc={doc.expiresAtUtc} />
                        <Chip
                          label={statusLabel(doc.status)}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, ...statusChipSx(doc.status) }}
                        />
                        <Button
                          size="small"
                          startIcon={<DownloadRoundedIcon fontSize="small" />}
                          onClick={() => handleDownload(doc.id, doc.originalFileName)}
                          sx={{
                            minWidth: 'unset',
                            borderRadius: DASHBOARD_TOKENS.radius.full,
                            textTransform: 'none',
                            fontWeight: 700,
                            color: DASHBOARD_TOKENS.primaryStrong,
                            backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                            '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
                          }}
                        >
                          Descarca
                        </Button>
                      </>
                    )}
                    <IconButton
                      component="label"
                      disabled={isUploading}
                      size="small"
                      aria-label={doc ? 'Reincarca document' : 'Incarca document'}
                      sx={{
                        borderRadius: DASHBOARD_TOKENS.radius.full,
                        color: DASHBOARD_TOKENS.primaryStrong,
                        backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                        '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
                      }}
                    >
                      {isUploading ? <CircularProgress size={18} /> : <AddRoundedIcon fontSize="small" />}
                      <input
                        hidden
                        type="file"
                        ref={(el) => { fileInputRefs.current[category] = el }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelected(file, category)
                          e.target.value = ''
                        }}
                      />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Expiry date picker — shown when an expirable file has been selected */}
                {hasPendingFile && isExpirable && (
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: `1px dashed ${alpha(DASHBOARD_TOKENS.primary, 0.2)}`,
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <CalendarTodayRoundedIcon sx={{ fontSize: 16, color: DASHBOARD_TOKENS.primary }} />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: DASHBOARD_TOKENS.ink, flexShrink: 0 }}>
                      Data expirării:
                    </Typography>
                    <input
                      type="date"
                      value={pendingExpiry[category] ?? ''}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setPendingExpiry((prev) => ({ ...prev, [category]: e.target.value }))}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.3)}`,
                        fontSize: '0.8rem',
                        fontFamily: 'inherit',
                        background: 'transparent',
                        color: 'inherit',
                        outline: 'none',
                      }}
                    />
                    <Stack direction="row" spacing={0.8}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={isUploading}
                        onClick={() => {
                          const file = pendingFile[category]
                          if (file) {
                            void handleUpload(file, category, pendingExpiry[category] || undefined)
                          }
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: DASHBOARD_TOKENS.radius.full,
                          fontSize: '0.78rem',
                          py: 0.4,
                          bgcolor: DASHBOARD_TOKENS.primary,
                          '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong },
                        }}
                      >
                        {isUploading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Încarcă'}
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        disabled={isUploading}
                        onClick={() => {
                          setPendingFile((prev) => { const n = { ...prev }; delete n[category]; return n })
                          setPendingExpiry((prev) => { const n = { ...prev }; delete n[category]; return n })
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: DASHBOARD_TOKENS.radius.full,
                          fontSize: '0.78rem',
                          py: 0.4,
                          color: DASHBOARD_TOKENS.textMuted,
                        }}
                      >
                        Anulează
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Paper>
            )
          })}
        </Stack>
      </Paper>

      {otherDocuments.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2 }}>
            Alte documente
          </Typography>
          <Stack spacing={1.4}>
            {otherDocuments.map((doc) => (
              <Paper
                key={doc.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  backgroundColor: DASHBOARD_TOKENS.surface,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}>
                  <div style={{ overflow: 'hidden' }}>
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {doc.originalFileName}
                    </Typography>
                    <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.75rem' }}>
                      {formatDocumentCategory(doc.category)} · {(doc.fileSize / 1024).toFixed(0)} KB
                    </Typography>
                  </div>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <ExpiryBadge expiresAtUtc={doc.expiresAtUtc} />
                    <Chip
                      label={statusLabel(doc.status)}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, ...statusChipSx(doc.status) }}
                    />
                    <Button
                      size="small"
                      startIcon={<DownloadRoundedIcon fontSize="small" />}
                      onClick={() => handleDownload(doc.id, doc.originalFileName)}
                      sx={{
                        minWidth: 'unset',
                        borderRadius: DASHBOARD_TOKENS.radius.full,
                        textTransform: 'none',
                        fontWeight: 700,
                        color: DASHBOARD_TOKENS.primaryStrong,
                        backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                        '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
                      }}
                    >
                      Descarca
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
