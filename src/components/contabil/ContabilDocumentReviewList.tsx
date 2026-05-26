import { useState } from 'react'
import {
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
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'

import { TOKENS } from '../../constants/tokens'
import { documentService, type DocumentSummary } from '../../services/document.service'
import { formatDocumentCategory } from '../../utils/formatters'
import { documentStatusColors, documentStatusLabel, normalizeDocumentStatus } from '../../utils/documentStatus'

interface ContabilDocumentReviewListProps {
  title: string
  subtitle?: string
  documents: DocumentSummary[]
  loading?: boolean
  onRefresh?: () => void
  onSnackbar?: (message: string, severity: 'success' | 'error') => void
}

export function ContabilDocumentReviewList({
  title,
  subtitle,
  documents,
  loading,
  onRefresh,
  onSnackbar,
}: ContabilDocumentReviewListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

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
      onRefresh?.()
      onSnackbar?.(status === 'Verified' ? 'Document aprobat.' : 'Document respins.', 'success')
    } catch {
      onSnackbar?.('Actualizarea statusului a eșuat.', 'error')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: subtitle ? 0.5 : 2 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
          {subtitle}
        </Typography>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: TOKENS.primary }} />
        </Box>
      )}

      {!loading && documents.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <InboxRoundedIcon sx={{ fontSize: 40, color: TOKENS.textSubtle, mb: 1 }} />
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            Niciun document în această categorie.
          </Typography>
        </Box>
      )}

      {!loading && documents.length > 0 && (
        <Stack spacing={1.5}>
          {documents.map((doc) => {
            const colors = documentStatusColors(doc.status)
            return (
              <Paper
                key={doc.id}
                elevation={0}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: TOKENS.radius.md,
                  bgcolor: alpha(TOKENS.surface, 0.5),
                  border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                }}
              >
                <InsertDriveFileRoundedIcon sx={{ color: TOKENS.primary, fontSize: 24 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={doc.originalFileName}>
                    {doc.originalFileName}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.3 }}>
                    <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
                      {formatDocumentCategory(doc.category)}
                    </Typography>
                    <Chip
                      label={documentStatusLabel(doc.status)}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        height: 20,
                        fontWeight: 700,
                        bgcolor: colors.bg,
                        color: colors.color,
                      }}
                    />
                  </Stack>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  {normalizeDocumentStatus(doc.status) === 'pending' && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleStatus(doc.id, 'Verified')}
                        disabled={statusUpdatingId === doc.id}
                        sx={{ color: '#10b981' }}
                        title="Aprobă"
                      >
                        {statusUpdatingId === doc.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <CheckCircleRoundedIcon fontSize="small" />
                        )}
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
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    startIcon={
                      downloadingId === doc.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <FileDownloadRoundedIcon />
                      )
                    }
                    sx={{ textTransform: 'none', borderRadius: TOKENS.radius.full }}
                  >
                    Descarcă
                  </Button>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
