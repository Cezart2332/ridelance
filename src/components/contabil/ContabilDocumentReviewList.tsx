import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'

import { TOKENS } from '../../constants/tokens'
import { documentService, type DocumentSummary } from '../../services/document.service'
import { formatDocumentCategory } from '../../utils/formatters'
import { documentStatusColors, documentStatusLabel, normalizeDocumentStatus } from '../../utils/documentStatus'

// ─── Expiry helpers ──────────────────────────────────────────────────────────

type ExpiryState = 'valid' | 'soon30' | 'soon7' | 'expired'

function getExpiryState(expiresAtUtc: string | null | undefined): ExpiryState | null {
  if (!expiresAtUtc) return null
  const expiry = new Date(expiresAtUtc)
  const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'soon7'
  if (diffDays <= 30) return 'soon30'
  return 'valid'
}

function ExpiryBadge({ expiresAtUtc }: { expiresAtUtc?: string | null }) {
  const state = getExpiryState(expiresAtUtc)
  if (!state) return null

  const formatted = new Date(expiresAtUtc!).toLocaleDateString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const configs: Record<ExpiryState, { icon: React.ReactElement; label: string; color: string; bg: string; border: string }> = {
    expired: {
      icon: <ErrorRoundedIcon sx={{ fontSize: '13px !important' }} />,
      label: 'Expirat',
      color: '#dc2626',
      bg: alpha('#ef4444', 0.1),
      border: alpha('#ef4444', 0.25),
    },
    soon7: {
      icon: <WarningAmberRoundedIcon sx={{ fontSize: '13px !important' }} />,
      label: `Exp. ${formatted}`,
      color: '#dc2626',
      bg: alpha('#ef4444', 0.08),
      border: alpha('#ef4444', 0.18),
    },
    soon30: {
      icon: <WarningAmberRoundedIcon sx={{ fontSize: '13px !important' }} />,
      label: `Exp. ${formatted}`,
      color: '#b45309',
      bg: alpha('#f59e0b', 0.1),
      border: alpha('#f59e0b', 0.22),
    },
    valid: {
      icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: '13px !important' }} />,
      label: `Exp. ${formatted}`,
      color: '#059669',
      bg: alpha('#10b981', 0.08),
      border: alpha('#10b981', 0.2),
    },
  }

  const cfg = configs[state]
  return (
    <Tooltip title={state === 'expired' ? `Expirat la ${formatted}` : `Expiră la ${formatted}`}>
      <Chip
        icon={cfg.icon}
        label={cfg.label}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.62rem',
          height: 20,
          bgcolor: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}
      />
    </Tooltip>
  )
}

// ─── Month filter helpers ─────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

function buildMonthOptions(documents: DocumentSummary[]): { value: string; label: string }[] {
  const seen = new Set<string>()
  for (const doc of documents) {
    const d = new Date(doc.uploadedAtUtc)
    seen.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return Array.from(seen)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const [year, month] = key.split('-')
      return { value: key, label: `${MONTH_NAMES[Number(month) - 1]} ${year}` }
    })
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const monthOptions = useMemo(() => buildMonthOptions(documents), [documents])

  const filteredDocs = useMemo(() => {
    if (selectedMonth === 'all') return documents
    const [year, month] = selectedMonth.split('-').map(Number)
    return documents.filter((doc) => {
      const d = new Date(doc.uploadedAtUtc)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
  }, [documents, selectedMonth])

  const handleDownload = async (doc: DocumentSummary) => {
    setDownloadingId(doc.id)
    try {
      await documentService.downloadAndSave(doc.id, doc.originalFileName)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleOpen = async (doc: DocumentSummary) => {
    setOpeningId(doc.id)
    try {
      await documentService.openInNewTab(doc.id, doc.originalFileName)
    } finally {
      setOpeningId(null)
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
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Month filter */}
      {!loading && documents.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: TOKENS.textSubtle }}>
            <FilterListRoundedIcon sx={{ fontSize: 18 }} />
            <CalendarTodayRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
          <Select
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: TOKENS.radius.full,
              minWidth: 170,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.12) },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.4) },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.primary },
            }}
          >
            <MenuItem value="all" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Toate lunile
            </MenuItem>
            {monthOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {selectedMonth !== 'all' && (
            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
              {filteredDocs.length} document{filteredDocs.length !== 1 ? 'e' : ''}
            </Typography>
          )}
        </Box>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: TOKENS.primary }} />
        </Box>
      )}

      {!loading && filteredDocs.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <InboxRoundedIcon sx={{ fontSize: 40, color: TOKENS.textSubtle, mb: 1 }} />
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            {selectedMonth !== 'all'
              ? 'Niciun document în luna selectată.'
              : 'Niciun document în această categorie.'}
          </Typography>
        </Box>
      )}

      {!loading && filteredDocs.length > 0 && (
        <Stack spacing={1.5}>
          {filteredDocs.map((doc) => {
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
                <InsertDriveFileRoundedIcon sx={{ color: TOKENS.primary, fontSize: 24, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={doc.originalFileName}>
                    {doc.originalFileName}
                  </Typography>
                  <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', mt: 0.3, flexWrap: 'wrap', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
                      {formatDocumentCategory(doc.category)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                      · {new Date(doc.uploadedAtUtc).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Typography>
                    <Chip
                      label={documentStatusLabel(doc.status)}
                      size="small"
                      sx={{
                        fontSize: '0.62rem',
                        height: 18,
                        fontWeight: 700,
                        bgcolor: colors.bg,
                        color: colors.color,
                      }}
                    />
                    <ExpiryBadge expiresAtUtc={doc.expiresAtUtc} />
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
                    variant="contained"
                    onClick={() => handleOpen(doc)}
                    disabled={openingId === doc.id}
                    startIcon={
                      openingId === doc.id ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <OpenInNewRoundedIcon />
                      )
                    }
                    sx={{ textTransform: 'none', borderRadius: TOKENS.radius.full, boxShadow: 'none' }}
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
