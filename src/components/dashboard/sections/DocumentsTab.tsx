import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { useEffect, useState } from 'react'
import { Button, Chip, CircularProgress, Paper, Stack, Typography, Snackbar, Alert } from '@mui/material'
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

  const handleUpload = async (file: File, category: string) => {
    setUploading(category)
    try {
      await documentService.upload(file, category)
      setSnackbar({ open: true, message: `Documentul "${category}" a fost încărcat cu succes!`, severity: 'success' })
      fetchDocuments() // Refresh after upload
    } catch (err: any) {
      console.error('Upload failed:', err)
      setSnackbar({ open: true, message: getErrorMessage(err, `Încărcarea documentului "${category}" a eșuat.`), severity: 'error' })
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
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

        {documents.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
            Nu ai niciun document incarcat inca.
          </Typography>
        ) : (
          <Stack spacing={1.4}>
            {documents.map((doc) => (
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
        )}
      </Paper>

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
          Incarca documente noi
        </Typography>
        <Stack spacing={1.4}>
          {['Buletin', 'AtestatSofer', 'CazierJudiciar', 'AdeverintaMedicala', 'ITP', 'RCA', 'Other'].map((category) => (
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
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{formatDocumentCategory(category)}</Typography>
                <Button
                  component="label"
                  size="small"
                  disabled={uploading === category}
                  startIcon={uploading === category ? <CircularProgress size={14} /> : <AddRoundedIcon fontSize="small" />}
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
                  Incarca
                  <input
                    hidden
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, category)
                    }}
                  />
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

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
    </div>
  )
}
