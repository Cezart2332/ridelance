import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
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

interface MainDocConfig {
  id: string;
  title: string;
  categories: string[];
  primaryCategory: string;
  tooltip?: string;
  complianceNote?: string;
  purchaseLink?: string;
}

const PERSONAL_PFA_DOCS: MainDocConfig[] = [
  {
    id: 'registration_certificate',
    title: 'Certificat de înregistrare (CAEN 4939)',
    categories: ['CertificatInregistrare'],
    primaryCategory: 'CertificatInregistrare',
    tooltip: 'Certificat de înregistrare din care să reiasă domeniul de activitate, cod CAEN 4939.',
  },
  {
    id: 'constatator',
    title: 'Certificat constatator (CAEN 4939)',
    categories: ['CertificatConstatator'],
    primaryCategory: 'CertificatConstatator',
    tooltip: 'Certificat constatator din care să reiasă domeniul de activitate, cod CAEN 4939.',
  },
  {
    id: 'alt_transport',
    title: 'Certificat de atestare profesională (Atestat)',
    categories: ['AtestatTransport', 'AtestatSofer'],
    primaryCategory: 'AtestatTransport',
    tooltip: 'Certificatul de atestare profesională al conducătorilor auto pentru transport de persoane în regim de închiriere.',
  },
  {
    id: 'criminal_record',
    title: 'Cazier judiciar al conducătorilor auto',
    categories: ['CazierJudiciar'],
    primaryCategory: 'CazierJudiciar',
    tooltip: 'Original, valabilitate 6 luni.',
  },
  {
    id: 'medical_cert',
    title: 'Aviz medical și psihologic al titularului',
    categories: ['AdeverintaMedicala'],
    primaryCategory: 'AdeverintaMedicala',
    tooltip: 'Aviz medical și psihologic al persoanei fizice titulare.',
  },
  {
    id: 'arr_payment',
    title: 'Dovada plății tarifului de eliberare ARR',
    categories: ['DovadaPlataArr'],
    primaryCategory: 'DovadaPlataArr',
    tooltip: 'Dovada plății tarifului de eliberare — 300 lei, achitat în contul Agenției teritoriale ARR.',
  },
]

const CONFORMITY_DOCS: MainDocConfig[] = [
  {
    id: 'transport_authorization',
    title: 'Autorizația pentru transport alternativ',
    categories: ['AutorizatieTransportAlternativ'],
    primaryCategory: 'AutorizatieTransportAlternativ',
  },
  {
    id: 'registration_document',
    title: 'Certificatul de înmatriculare (Talon)',
    categories: ['Talon', 'ITP'],
    primaryCategory: 'Talon',
  },
  {
    id: 'car_identity_book',
    title: 'Cartea de identitate a autoturismului (toate paginile)',
    categories: ['CarteIdentitateAuto'],
    primaryCategory: 'CarteIdentitateAuto',
  },
  {
    id: 'vehicle_contract_conformity',
    title: 'Contract de închiriere / comodat autentificat / leasing',
    categories: ['ContractVehicul'],
    primaryCategory: 'ContractVehicul',
  },
  {
    id: 'leasing_agreement',
    title: 'Acord de leasing',
    categories: ['AcordLeasing'],
    primaryCategory: 'AcordLeasing',
    complianceNote: 'După caz.',
  },
  {
    id: 'conformity_payment',
    title: 'Dovada plății tarif copie conformă și ecusoane',
    categories: ['DovadaPlataCopieConformaEcusoane'],
    primaryCategory: 'DovadaPlataCopieConformaEcusoane',
    complianceNote: '1 an: 116 lei; 2 ani: 216 lei; 3 ani: 316 lei.',
  },
]

const VEHICLE_DOCS: MainDocConfig[] = [
  {
    id: 'talon',
    title: 'Talon (ITP 6 luni)',
    categories: ['Talon', 'ITP'],
    primaryCategory: 'Talon',
    tooltip: 'Certificat de înmatriculare / Talon cu ITP valabil 6 luni.',
  },
  {
    id: 'rca',
    title: 'RCA',
    categories: ['RCA'],
    primaryCategory: 'RCA',
    tooltip: 'Poliță de asigurare de răspundere civilă auto.',
  },
  {
    id: 'copie_conforma',
    title: 'Copie conformă',
    categories: ['CopieConforma'],
    primaryCategory: 'CopieConforma',
    tooltip: 'Copie conformă valabilă pentru vehicul.',
  },
  {
    id: 'ecuson_uber',
    title: 'Ecuson Uber',
    categories: ['EcusonUber'],
    primaryCategory: 'EcusonUber',
    tooltip: 'Ecuson eliberat de operatorul Uber.',
  },
  {
    id: 'ecuson_bolt',
    title: 'Ecuson Bolt',
    categories: ['EcusonBolt'],
    primaryCategory: 'EcusonBolt',
    tooltip: 'Ecuson eliberat de operatorul Bolt.',
  },
  {
    id: 'passenger_insurance',
    title: 'Asigurare calatori si bagaje',
    categories: ['AsigurareCalatori'],
    primaryCategory: 'AsigurareCalatori',
    tooltip: 'Asigurare de persoane și bagaje.',
    complianceNote: 'Optional pentru Uber, obligatoriu pentru Bolt.',
    purchaseLink: '#',
  },
  {
    id: 'vehicle_contract',
    title: 'Contract de comodat / de închiriere vehicul',
    categories: ['ContractVehicul'],
    primaryCategory: 'ContractVehicul',
    tooltip: 'Contract justificativ pentru utilizarea vehiculului.',
  },
]

// Categories that require an expiry date when uploading
const EXPIRABLE_CATEGORIES = new Set([
  'Buletin',
  'CarteIdentitate',
  'AsigurareCalatori',
  'ITP',
  'Talon',
  'RCA',
  'PermisConducere',
  'CopieConforma',
  'EcusonUber',
  'EcusonBolt',
  'ContractVehicul',
])

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
  if (s === 'pending') return 'În curs de aprobare'
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

interface DocumentsTabProps {
  onNavigate?: (section: string) => void;
}

export function DocumentsTab({ onNavigate }: DocumentsTabProps) {
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

  // Maps a main doc config to its latest matching uploaded document
  const findDocForConfig = (config: MainDocConfig) => {
    const matches = documents.filter((doc) => config.categories.includes(doc.category))
    if (matches.length === 0) return null
    return matches.sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())[0]
  }

  // Determine all categories handled in main lists
  const allMainCategories = useMemo(() => {
    const cats = new Set<string>()
    PERSONAL_PFA_DOCS.forEach((d) => d.categories.forEach((c) => cats.add(c)))
    CONFORMITY_DOCS.forEach((d) => d.categories.forEach((c) => cats.add(c)))
    VEHICLE_DOCS.forEach((d) => d.categories.forEach((c) => cats.add(c)))
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

  const renderDocRow = (config: MainDocConfig) => {
    const doc = findDocForConfig(config)
    const category = config.primaryCategory
    const isUploading = uploading === category
    const isExpirable = EXPIRABLE_CATEGORIES.has(category)
    const hasPendingFile = !!pendingFile[category]

    return (
      <Paper
        key={config.id}
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          border: `1px solid ${hasPendingFile ? alpha(DASHBOARD_TOKENS.primary, 0.35) : DASHBOARD_TOKENS.border}`,
          backgroundColor: hasPendingFile ? alpha(DASHBOARD_TOKENS.primary, 0.03) : DASHBOARD_TOKENS.surface,
          transition: 'all 0.2s',
        }}
      >
        <Stack spacing={1}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            sx={{ 
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' }, 
              gap: 1.5 
            }}
          >
            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <Tooltip title={config.tooltip || ''}>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, cursor: config.tooltip ? 'help' : 'default', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {config.title}
                </Typography>
              </Tooltip>
              {!doc && (
                <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.78rem', mt: 0.3 }}>
                  Lipsă
                </Typography>
              )}
            </div>
            <Stack 
              direction="row" 
              spacing={0.8} 
              sx={{ 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 0.8,
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                flexShrink: 0 
              }}
            >
              {doc ? (
                <>
                  <ExpiryBadge expiresAtUtc={doc.expiresAtUtc} />
                  <Chip
                    label={statusLabel(doc.status)}
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, ...statusChipSx(doc.status) }}
                  />
                  <Tooltip title="Vizualizează">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(doc.id, doc.originalFileName)}
                      sx={{
                        borderRadius: DASHBOARD_TOKENS.radius.full,
                        color: DASHBOARD_TOKENS.textMuted,
                        backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.04),
                        '&:hover': { color: DASHBOARD_TOKENS.primaryStrong, backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.12) },
                      }}
                    >
                      <VisibilityRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Descarcă">
                    <IconButton
                    size="small"
                    onClick={() => handleDownload(doc.id, doc.originalFileName)}
                    sx={{
                      borderRadius: DASHBOARD_TOKENS.radius.full,
                      color: DASHBOARD_TOKENS.primaryStrong,
                      backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                      '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
                    }}
                  >
                      <DownloadRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <Chip
                  label="Lipsă"
                  size="small"
                  sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, ...statusChipSx('missing') }}
                />
              )}
              <IconButton
                component="label"
                disabled={isUploading}
                size="small"
                aria-label={doc ? 'Reîncarcă document' : 'Încarcă document'}
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

          {config.complianceNote && (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mt: 0.5 }}>
              {config.complianceNote}
            </Typography>
          )}

          {config.purchaseLink && (
            <Button
              onClick={() => onNavigate?.('support')}
              sx={{
                alignSelf: 'flex-start',
                px: 0,
                minWidth: 'unset',
                textTransform: 'none',
                color: DASHBOARD_TOKENS.primaryStrong,
                fontWeight: 700,
                fontSize: '0.82rem',
                '&:hover': { background: 'transparent', textDecoration: 'underline' }
              }}
            >
              Solicită detalii
            </Button>
          )}

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
        </Stack>
      </Paper>
    )
  }

  const renderOtherDocList = (docsList: DocumentSummary[]) => {
    return (
      <Stack spacing={1.2}>
        {docsList.map((doc) => (
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
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              sx={{ 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' }, 
                gap: 1.5 
              }}
            >
              <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.88rem', wordBreak: 'break-all' }} title={doc.originalFileName}>
                  {doc.originalFileName}
                </Typography>
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.75rem', mt: 0.3 }}>
                  {formatDocumentCategory(doc.category)} · {(doc.fileSize / 1024).toFixed(0)} KB
                </Typography>
              </div>
              <Stack 
                direction="row" 
                spacing={0.8} 
                sx={{ 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: 0.8,
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  flexShrink: 0 
                }}
              >
                <ExpiryBadge expiresAtUtc={doc.expiresAtUtc} />
                <Chip
                  label={statusLabel(doc.status)}
                  size="small"
                  sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, ...statusChipSx(doc.status) }}
                />
                <Tooltip title="Vizualizează">
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(doc.id, doc.originalFileName)}
                    sx={{
                      borderRadius: DASHBOARD_TOKENS.radius.full,
                      color: DASHBOARD_TOKENS.textMuted,
                      backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.04),
                      '&:hover': { color: DASHBOARD_TOKENS.primaryStrong, backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.12) },
                    }}
                  >
                    <VisibilityRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Descarcă">
                  <IconButton
                  size="small"
                  onClick={() => handleDownload(doc.id, doc.originalFileName)}
                  sx={{
                    borderRadius: DASHBOARD_TOKENS.radius.full,
                    color: DASHBOARD_TOKENS.primaryStrong,
                    backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                    '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
                  }}
                >
                    <DownloadRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
      {/* Documente Autorizatie Transport Alternativ */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2, fontSize: '1.1rem' }}>
            Documente Autorizație Transport Alternativ
          </Typography>
          <Stack spacing={1.4}>
            {PERSONAL_PFA_DOCS.map(renderDocRow)}
          </Stack>

          {pfaOtherDocs.length > 0 && (
            <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${DASHBOARD_TOKENS.border}` }}>
              <Typography variant="subtitle2" sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                Alte documente personale / PFA
              </Typography>
              {renderOtherDocList(pfaOtherDocs)}
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, pt: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            component="label"
            size="small"
            startIcon={<AddRoundedIcon fontSize="small" />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: DASHBOARD_TOKENS.primaryStrong,
              backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
              borderRadius: DASHBOARD_TOKENS.radius.full,
              px: 2.5,
              py: 0.8,
              '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
            }}
          >
            Încarcă alt document PFA
            <input
              hidden
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUpload(file, 'Other')
                }
                e.target.value = ''
              }}
            />
          </Button>
        </Box>
      </Paper>

      {/* Documente Copie Conforma si Ecusoane */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2, fontSize: '1.1rem' }}>
            Documente Copie Conformă și Ecusoane
          </Typography>
          <Stack spacing={1.4}>
            {CONFORMITY_DOCS.map(renderDocRow)}
          </Stack>
        </Box>
      </Paper>

      {/* Documente vehicul */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2, fontSize: '1.1rem' }}>
            Documente vehicul
          </Typography>
          <Stack spacing={1.4}>
            {VEHICLE_DOCS.map(renderDocRow)}
          </Stack>

          {vehicleOtherDocs.length > 0 && (
            <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${DASHBOARD_TOKENS.border}` }}>
              <Typography variant="subtitle2" sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                Alte documente vehicul
              </Typography>
              {renderOtherDocList(vehicleOtherDocs)}
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, pt: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            component="label"
            size="small"
            startIcon={<AddRoundedIcon fontSize="small" />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: DASHBOARD_TOKENS.primaryStrong,
              backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
              borderRadius: DASHBOARD_TOKENS.radius.full,
              px: 2.5,
              py: 0.8,
              '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
            }}
          >
            Încarcă alt document vehicul
            <input
              hidden
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Prepend Vehicul_ to filename so that we can sort it cleanly under Vehicle column in otherDocuments list
                  const renamedFile = new File([file], `Vehicul_${file.name}`, { type: file.type })
                  void handleUpload(renamedFile, 'Other')
                }
                e.target.value = ''
              }}
            />
          </Button>
        </Box>
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
    </Box>
  )
}
