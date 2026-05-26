import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, Typography, Snackbar, Alert } from '@mui/material'
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

export function DocumentsTab() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'error' })

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

  const handleUpload = async (file: File, category: string) => {
    setUploading(category)
    try {
      await documentService.upload(file, category)
      setSnackbar({ open: true, message: `Documentul "${formatDocumentCategory(category)}" a fost încărcat cu succes!`, severity: 'success' })
      fetchDocuments()
    } catch (err: any) {
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
    } catch (err: any) {
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

            return (
              <Paper
                key={category}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  backgroundColor: DASHBOARD_TOKENS.surface,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}>
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
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
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(file, category)
                          e.target.value = ''
                        }}
                      />
                    </IconButton>
                  </Stack>
                </Stack>
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
