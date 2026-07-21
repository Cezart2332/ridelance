import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
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

import {
  DOC_GROUPS,
  EXPIRABLE_CATEGORIES,
  type MainDocConfig,
} from '../../../constants/documentSections'

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
  if (s === 'pending') return 'În aprobare'
  if (s === 'rejected') return 'Respins'
  return 'Lipsă'
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

/** Iconița colorată din stânga fiecărui rând, în funcție de starea documentului. */
function rowVisual(doc: DocumentSummary | null) {
  if (!doc) {
    return { icon: <UploadFileRoundedIcon sx={{ fontSize: 20 }} />, color: DASHBOARD_TOKENS.textSubtle, bg: alpha(DASHBOARD_TOKENS.ink, 0.05) }
  }
  if (getExpiryState(doc.expiresAtUtc) === 'expired') {
    return { icon: <ErrorRoundedIcon sx={{ fontSize: 20 }} />, color: '#dc2626', bg: alpha('#ef4444', 0.1) }
  }
  const s = doc.status.toLowerCase()
  if (s === 'approved' || s === 'verified') {
    return { icon: <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />, color: '#059669', bg: alpha('#10b981', 0.1) }
  }
  if (s === 'pending') {
    return { icon: <HourglassTopRoundedIcon sx={{ fontSize: 20 }} />, color: '#b45309', bg: alpha('#f59e0b', 0.12) }
  }
  return { icon: <ErrorRoundedIcon sx={{ fontSize: 20 }} />, color: '#dc2626', bg: alpha('#ef4444', 0.1) }
}

const iconActionSx = {
  borderRadius: DASHBOARD_TOKENS.radius.full,
  color: DASHBOARD_TOKENS.textMuted,
  backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.04),
  '&:hover': { color: DASHBOARD_TOKENS.primaryStrong, backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.12) },
} as const

interface DocumentsTabProps {
  onNavigate?: (section: string) => void;
}

export function DocumentsTab({ onNavigate }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string>(DOC_GROUPS[0].id)
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

  // Maps a main doc config to its latest matching uploaded document
  const findDocForConfig = (config: MainDocConfig) => {
    const matches = documents.filter((doc) => config.categories.includes(doc.category))
    if (matches.length === 0) return null
    return matches.sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())[0]
  }

  // Determine all categories handled in main lists
  const allMainCategories = useMemo(() => {
    const cats = new Set<string>()
    DOC_GROUPS.forEach((g) => g.docs.forEach((d) => d.categories.forEach((c) => cats.add(c))))
    return cats
  }, [])

  // Filter out any other documents
  const otherDocuments = useMemo(() => {
    return documents.filter((doc) => !allMainCategories.has(doc.category))
  }, [documents, allMainCategories])

  // Classify custom documents into PFA and Vehicle categories
  const isVehicleOtherDoc = (doc: DocumentSummary) => {
    const name = doc.originalFileName.toLowerCase()
    return name.includes('vehicul') || name.includes('auto') || name.includes('masina') || name.includes('talon') || name.includes('car') || name.includes('ecuson')
  }

  const pfaOtherDocs = useMemo(() => otherDocuments.filter(d => !isVehicleOtherDoc(d)), [otherDocuments])
  const vehicleOtherDocs = useMemo(() => otherDocuments.filter(d => isVehicleOtherDoc(d)), [otherDocuments])

  // Progres per grup + totaluri pentru antet
  const groupStats = useMemo(() => {
    const stats = new Map<string, { uploaded: number; total: number; attention: number }>()
    let valid = 0
    let pending = 0
    let missing = 0
    let expired = 0

    DOC_GROUPS.forEach((group) => {
      let uploaded = 0
      let attention = 0
      group.docs.forEach((config) => {
        const doc = findDocForConfig(config)
        if (doc) {
          uploaded += 1
          const s = doc.status.toLowerCase()
          const isExpired = getExpiryState(doc.expiresAtUtc) === 'expired'
          if (isExpired) {
            expired += 1
            attention += 1
          } else if (s === 'approved' || s === 'verified') {
            valid += 1
          } else if (s === 'pending') {
            pending += 1
          } else {
            attention += 1
          }
        } else {
          missing += 1
          attention += 1
        }
      })
      stats.set(group.id, { uploaded, total: group.docs.length, attention })
    })

    const total = DOC_GROUPS.reduce((sum, g) => sum + g.docs.length, 0)
    const uploadedTotal = [...stats.values()].reduce((sum, s) => sum + s.uploaded, 0)
    return { perGroup: stats, total, uploadedTotal, valid, pending, missing, expired }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents])

  const activeGroup = DOC_GROUPS.find((g) => g.id === activeGroupId) ?? DOC_GROUPS[0]

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

  const handleOpen = async (id: string, fileName: string) => {
    try {
      await documentService.openInNewTab(id, fileName)
    } catch (err: unknown) {
      console.error('Open failed:', err)
      setSnackbar({ open: true, message: getErrorMessage(err, 'Documentul nu a putut fi deschis. Te rugăm să încerci din nou.'), severity: 'error' })
    }
  }

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <CircularProgress size={32} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    )
  }

  const renderDocRow = (config: MainDocConfig, isLast: boolean) => {
    const doc = findDocForConfig(config)
    const category = config.primaryCategory
    const isUploading = uploading === category
    const isExpirable = EXPIRABLE_CATEGORIES.has(category)
    const hasPendingFile = !!pendingFile[category]
    const visual = rowVisual(doc)
    const isExpired = doc ? getExpiryState(doc.expiresAtUtc) === 'expired' : false

    return (
      <Box
        key={config.id}
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 1.8,
          borderBottom: isLast ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
          backgroundColor: hasPendingFile ? alpha(DASHBOARD_TOKENS.primary, 0.04) : 'transparent',
          transition: 'background-color 0.2s',
          '&:hover': { backgroundColor: hasPendingFile ? alpha(DASHBOARD_TOKENS.primary, 0.04) : DASHBOARD_TOKENS.surface },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, gap: { xs: 1.2, md: 2 } }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: DASHBOARD_TOKENS.radius.md,
                color: visual.color,
                backgroundColor: visual.bg,
              }}
            >
              {visual.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Tooltip title={config.tooltip || ''}>
                <Typography
                  sx={{
                    color: DASHBOARD_TOKENS.ink,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    lineHeight: 1.4,
                    cursor: config.tooltip ? 'help' : 'default',
                  }}
                >
                  {config.title}
                </Typography>
              </Tooltip>
              {config.complianceNote && (
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.78rem', mt: 0.2 }}>
                  {config.complianceNote}
                </Typography>
              )}
              {config.purchaseLink && (
                <Button
                  onClick={() => onNavigate?.('support')}
                  sx={{
                    px: 0,
                    minWidth: 'unset',
                    textTransform: 'none',
                    color: DASHBOARD_TOKENS.primaryStrong,
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    '&:hover': { background: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Solicită detalii
                </Button>
              )}
            </Box>
          </Stack>

          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 0.8,
              flexWrap: 'wrap',
              flexShrink: 0,
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              pl: { xs: '53px', md: 0 },
            }}
          >
            {doc && <ExpiryBadge expiresAtUtc={doc.expiresAtUtc} />}
            <Chip
              label={doc ? (isExpired ? 'De reînnoit' : statusLabel(doc.status)) : 'Lipsă'}
              size="small"
              sx={{
                fontWeight: 700,
                borderRadius: DASHBOARD_TOKENS.radius.full,
                ...statusChipSx(isExpired ? 'expired' : doc ? doc.status : 'missing'),
              }}
            />
            {doc && (
              <>
                <Tooltip title="Vizualizează">
                  <IconButton size="small" onClick={() => handleOpen(doc.id, doc.originalFileName)} sx={iconActionSx}>
                    <VisibilityRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Descarcă">
                  <IconButton size="small" onClick={() => handleDownload(doc.id, doc.originalFileName)} sx={iconActionSx}>
                    <DownloadRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title={doc ? 'Încarcă din nou' : 'Încarcă document'}>
              <IconButton
                component="label"
                disabled={isUploading}
                size="small"
                aria-label={doc ? 'Reîncarcă document' : 'Încarcă document'}
                sx={{
                  borderRadius: DASHBOARD_TOKENS.radius.full,
                  color: DASHBOARD_TOKENS.primaryStrong,
                  backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.1),
                  '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.2) },
                }}
              >
                {isUploading ? <CircularProgress size={18} /> : <UploadRoundedIcon fontSize="small" />}
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
            </Tooltip>
          </Stack>
        </Stack>

        {/* Expiry date picker — shown when an expirable file has been selected */}
        {hasPendingFile && isExpirable && (
          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              ml: { xs: 0, md: '53px' },
              borderTop: `1px dashed ${alpha(DASHBOARD_TOKENS.primary, 0.25)}`,
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
      </Box>
    )
  }

  const renderOtherDocRow = (doc: DocumentSummary, isLast: boolean) => (
    <Box
      key={doc.id}
      sx={{
        px: { xs: 2, md: 2.5 },
        py: 1.6,
        borderBottom: isLast ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
        '&:hover': { backgroundColor: DASHBOARD_TOKENS.surface },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, gap: { xs: 1, md: 2 } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.88rem', wordBreak: 'break-all' }}
            title={doc.originalFileName}
          >
            {doc.originalFileName}
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.75rem', mt: 0.2 }}>
            {formatDocumentCategory(doc.category)} · {(doc.fileSize / 1024).toFixed(0)} KB
          </Typography>
        </Box>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.8, flexWrap: 'wrap', flexShrink: 0 }}>
          <ExpiryBadge expiresAtUtc={doc.expiresAtUtc} />
          <Chip
            label={getExpiryState(doc.expiresAtUtc) === 'expired' ? 'De reînnoit' : statusLabel(doc.status)}
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: DASHBOARD_TOKENS.radius.full,
              ...statusChipSx(getExpiryState(doc.expiresAtUtc) === 'expired' ? 'expired' : doc.status),
            }}
          />
          <Tooltip title="Vizualizează">
            <IconButton size="small" onClick={() => handleOpen(doc.id, doc.originalFileName)} sx={iconActionSx}>
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descarcă">
            <IconButton size="small" onClick={() => handleDownload(doc.id, doc.originalFileName)} sx={iconActionSx}>
              <DownloadRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  )

  const activeOtherDocs = activeGroup.otherKind === 'pfa' ? pfaOtherDocs : activeGroup.otherKind === 'vehicle' ? vehicleOtherDocs : []
  const progressPercent = groupStats.total > 0 ? Math.round((groupStats.uploadedTotal / groupStats.total) * 100) : 0

  const summaryChips = [
    { label: `${groupStats.valid} valide`, color: '#059669', bg: alpha('#10b981', 0.08) },
    { label: `${groupStats.pending} în aprobare`, color: '#b45309', bg: alpha('#f59e0b', 0.1) },
    { label: `${groupStats.missing} lipsă`, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.05) },
    ...(groupStats.expired > 0
      ? [{ label: `${groupStats.expired} expirate`, color: '#dc2626', bg: alpha('#ef4444', 0.08) }]
      : []),
  ]

  return (
    <Stack spacing={2.5}>
      {/* Antet: progres general */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.15rem' }}>
              Documentele tale
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.88rem', mt: 0.4 }}>
              Încarcă și urmărește documentele necesare pentru autorizare și pentru vehicul.
            </Typography>
          </Box>
          <Box sx={{ minWidth: { md: 300 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 0.7 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem', fontWeight: 650 }}>
                Progres documente
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontSize: '0.85rem', fontWeight: 800 }}>
                {groupStats.uploadedTotal}/{groupStats.total}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: DASHBOARD_TOKENS.radius.full,
                backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.06),
                '& .MuiLinearProgress-bar': { borderRadius: DASHBOARD_TOKENS.radius.full, backgroundColor: DASHBOARD_TOKENS.primary },
              }}
            />
            <Stack direction="row" sx={{ gap: 0.8, mt: 1.2, flexWrap: 'wrap' }}>
              {summaryChips.map((chip) => (
                <Chip
                  key={chip.label}
                  label={chip.label}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, color: chip.color, backgroundColor: chip.bg, borderRadius: DASHBOARD_TOKENS.radius.full }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Taburi categorii */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {DOC_GROUPS.map((group) => {
          const stats = groupStats.perGroup.get(group.id)
          const isActive = group.id === activeGroupId
          return (
            <ButtonBase
              key={group.id}
              onClick={() => setActiveGroupId(group.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.1,
                flexShrink: 0,
                borderRadius: DASHBOARD_TOKENS.radius.full,
                border: `1px solid ${isActive ? alpha(DASHBOARD_TOKENS.primary, 0.5) : DASHBOARD_TOKENS.border}`,
                backgroundColor: isActive ? alpha(DASHBOARD_TOKENS.primary, 0.1) : DASHBOARD_TOKENS.paper,
                color: isActive ? DASHBOARD_TOKENS.ink : DASHBOARD_TOKENS.textMuted,
                transition: 'all 0.2s',
                '&:hover': { borderColor: alpha(DASHBOARD_TOKENS.primary, 0.5), backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.06) },
              }}
            >
              <Box sx={{ display: 'grid', placeItems: 'center', color: isActive ? DASHBOARD_TOKENS.primaryStrong : DASHBOARD_TOKENS.textSubtle }}>
                {group.icon}
              </Box>
              <Typography noWrap sx={{ fontWeight: isActive ? 800 : 650, fontSize: '0.88rem', color: 'inherit' }}>
                {group.label}
              </Typography>
              <Chip
                label={`${stats?.uploaded ?? 0}/${stats?.total ?? 0}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  borderRadius: DASHBOARD_TOKENS.radius.full,
                  color: stats && stats.uploaded === stats.total ? '#059669' : DASHBOARD_TOKENS.textMuted,
                  backgroundColor: stats && stats.uploaded === stats.total ? alpha('#10b981', 0.1) : alpha(DASHBOARD_TOKENS.ink, 0.05),
                }}
              />
            </ButtonBase>
          )
        })}
      </Box>

      {/* Panoul categoriei active */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            px: { xs: 2, md: 2.5 },
            py: 2,
            gap: 1.5,
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
            backgroundColor: DASHBOARD_TOKENS.surface,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1rem' }}>
              {activeGroup.label}
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mt: 0.2 }}>
              {activeGroup.description}
            </Typography>
          </Box>
          {activeGroup.otherKind && (
            <Button
              component="label"
              size="small"
              startIcon={<AddRoundedIcon fontSize="small" />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                flexShrink: 0,
                color: DASHBOARD_TOKENS.primaryStrong,
                backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                borderRadius: DASHBOARD_TOKENS.radius.full,
                px: 2,
                py: 0.7,
                '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
              }}
            >
              {activeGroup.otherKind === 'pfa' ? 'Încarcă alt document PFA' : 'Încarcă alt document vehicul'}
              <input
                hidden
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (activeGroup.otherKind === 'vehicle') {
                      // Prepend Vehicul_ to filename so that we can sort it cleanly under Vehicle group in otherDocuments list
                      const renamedFile = new File([file], `Vehicul_${file.name}`, { type: file.type })
                      void handleUpload(renamedFile, 'Other')
                    } else {
                      void handleUpload(file, 'Other')
                    }
                  }
                  e.target.value = ''
                }}
              />
            </Button>
          )}
        </Stack>

        <Box>
          {activeGroup.docs.map((config, index) => renderDocRow(config, index === activeGroup.docs.length - 1))}
        </Box>

        {activeOtherDocs.length > 0 && (
          <>
            <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.2, borderTop: `1px solid ${DASHBOARD_TOKENS.border}`, backgroundColor: DASHBOARD_TOKENS.surface }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.72rem' }}>
                {activeGroup.otherKind === 'pfa' ? 'Alte documente personale / PFA' : 'Alte documente vehicul'}
              </Typography>
            </Box>
            {activeOtherDocs.map((doc, index) => renderOtherDocRow(doc, index === activeOtherDocs.length - 1))}
          </>
        )}
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
    </Stack>
  )
}
