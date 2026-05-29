import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { Box, Button, Chip, IconButton, Paper, Stack, Typography, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

interface MockDocument {
  id: string;
  originalFileName: string;
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
    id: 'id_card',
    title: 'Carte de identitate',
    categories: ['CarteIdentitate', 'Buletin'],
    primaryCategory: 'CarteIdentitate',
    tooltip: 'Carte de identitate sau Buletin valid.',
  },
  {
    id: 'driver_license',
    title: 'Permis de conducere',
    categories: ['PermisConducere'],
    primaryCategory: 'PermisConducere',
    tooltip: 'Permis de conducere valid.',
  },
  {
    id: 'alt_transport',
    title: 'Atestat transport alternativ (Uber/Bolt)',
    categories: ['AtestatTransport', 'AtestatSofer'],
    primaryCategory: 'AtestatTransport',
    tooltip: 'Atestat profesional pentru conducătorii auto.',
  },
  {
    id: 'medical_cert',
    title: 'Adeverinta medicala + psihologica',
    categories: ['AdeverintaMedicala'],
    primaryCategory: 'AdeverintaMedicala',
    tooltip: 'Adeverință medicală și aviz psihologic.',
  },
  {
    id: 'criminal_record',
    title: 'Certificat de cazier judiciar',
    categories: ['CazierJudiciar'],
    primaryCategory: 'CazierJudiciar',
    tooltip: 'Cazier judiciar fără înscrieri.',
  },
]

const VEHICLE_DOCS: MainDocConfig[] = [
  {
    id: 'itp',
    title: 'ITP',
    categories: ['ITP'],
    primaryCategory: 'ITP',
    tooltip: 'Inspecție Tehnică Periodică valabilă.',
  },
  {
    id: 'rca',
    title: 'RCA',
    categories: ['RCA'],
    primaryCategory: 'RCA',
    tooltip: 'Poliță de asigurare de răspundere civilă auto.',
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
]

function statusChipSx(status: string) {
  const s = status.toLowerCase()
  if (s === 'approved' || s === 'verified' || s === 'valid') {
    return { borderColor: alpha('#2e7d32', 0.2), color: '#2e7d32', backgroundColor: alpha('#2e7d32', 0.08) }
  }
  if (s === 'pending' || s === 'in verificare') {
    return { borderColor: alpha('#ed6c02', 0.2), color: '#b54708', backgroundColor: alpha('#ed6c02', 0.1) }
  }
  return { borderColor: alpha('#d32f2f', 0.2), color: '#b71c1c', backgroundColor: alpha('#d32f2f', 0.08) }
}

function statusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'approved' || s === 'verified' || s === 'valid') return 'Valid'
  if (s === 'pending' || s === 'in verificare') return 'In verificare'
  return 'Lipsa'
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
  // Static read-only mockup data
  const documents: MockDocument[] = [
    {
      id: 'demo_id_card',
      originalFileName: 'ci_sofer_demo.jpg',
      category: 'CarteIdentitate',
      status: 'In verificare',
      fileSize: 450000,
      uploadedAtUtc: new Date().toISOString(),
    },
    {
      id: 'demo_license',
      originalFileName: 'permis_fata_verso.png',
      category: 'PermisConducere',
      status: 'Valid',
      fileSize: 520000,
      uploadedAtUtc: new Date().toISOString(),
      expiresAtUtc: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 4).toISOString(), // 4 years
    },
    {
      id: 'demo_med',
      originalFileName: 'adeverinta_medicala_semnata.pdf',
      category: 'AdeverintaMedicala',
      status: 'Valid',
      fileSize: 840000,
      uploadedAtUtc: new Date().toISOString(),
    },
    {
      id: 'demo_cazier',
      originalFileName: 'cazier_judiciar_curat.pdf',
      category: 'CazierJudiciar',
      status: 'Valid',
      fileSize: 1040000,
      uploadedAtUtc: new Date().toISOString(),
    },
    {
      id: 'demo_itp',
      originalFileName: 'itp_vizat_anul_curent.pdf',
      category: 'ITP',
      status: 'Valid',
      fileSize: 310000,
      uploadedAtUtc: new Date().toISOString(),
      expiresAtUtc: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(), // ~6 months
    },
    {
      id: 'demo_rca',
      originalFileName: 'polita_rca_ridelance.pdf',
      category: 'RCA',
      status: 'Valid',
      fileSize: 280000,
      uploadedAtUtc: new Date().toISOString(),
      expiresAtUtc: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(), // 25 days (soon30 badge)
    },
    {
      id: 'demo_ecuson_u',
      originalFileName: 'ecuson_uber_2026.png',
      category: 'EcusonUber',
      status: 'In verificare',
      fileSize: 640000,
      uploadedAtUtc: new Date().toISOString(),
    },
    // Mock Alte Documente
    {
      id: 'demo_cert_inreg',
      originalFileName: 'Certificat_Inregistrare_PFA.pdf',
      category: 'CertificatInregistrare',
      status: 'Valid',
      fileSize: 14336,
      uploadedAtUtc: new Date().toISOString(),
    },
    {
      id: 'demo_comodat_car',
      originalFileName: 'Vehicul_Contract_Comodat_Auto.pdf',
      category: 'Other',
      status: 'Valid',
      fileSize: 42100,
      uploadedAtUtc: new Date().toISOString(),
    }
  ]

  // Maps a main doc config to its latest matching uploaded document
  const findDocForConfig = (config: MainDocConfig) => {
    const matches = documents.filter((doc) => config.categories.includes(doc.category))
    if (matches.length === 0) return null
    return matches.sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())[0]
  }

  // Determine all categories handled in main lists
  const allMainCategories = new Set<string>()
  PERSONAL_PFA_DOCS.forEach((d) => d.categories.forEach((c) => allMainCategories.add(c)))
  VEHICLE_DOCS.forEach((d) => d.categories.forEach((c) => allMainCategories.add(c)))

  const otherDocuments = documents.filter((doc) => {
    // Collect all main categories dynamically
    const mainCats = new Set<string>()
    PERSONAL_PFA_DOCS.forEach((d) => d.categories.forEach((c) => mainCats.add(c)))
    VEHICLE_DOCS.forEach((d) => d.categories.forEach((c) => mainCats.add(c)))
    return !mainCats.has(doc.category)
  })

  // Classify custom documents into PFA and Vehicle categories
  const isVehicleOtherDoc = (doc: MockDocument) => {
    const name = doc.originalFileName.toLowerCase()
    return name.includes('vehicul') || name.includes('auto') || name.includes('masina') || name.includes('talon') || name.includes('car') || name.includes('ecuson')
  }

  const pfaOtherDocs = otherDocuments.filter(d => !isVehicleOtherDoc(d))
  const vehicleOtherDocs = otherDocuments.filter(d => isVehicleOtherDoc(d))

  const formatDocumentCategory = (category: string) => {
    switch (category) {
      case 'CertificatInregistrare': return 'Certificat de Înregistrare'
      case 'CarteIdentitate': return 'Carte de Identitate'
      case 'Buletin': return 'Buletin / CI'
      case 'PermisConducere': return 'Permis de Conducere'
      case 'AtestatTransport': return 'Atestat Transport'
      case 'AtestatSofer': return 'Atestat Șofer'
      case 'AdeverintaMedicala': return 'Adeverință Medicală'
      case 'CazierJudiciar': return 'Cazier Judiciar'
      case 'ITP': return 'ITP Valid'
      case 'RCA': return 'Poliță RCA'
      case 'EcusonUber': return 'Ecuson Uber'
      case 'EcusonBolt': return 'Ecuson Bolt'
      case 'AsigurareCalatori': return 'Asigurare Călători'
      default: return 'Alt Document'
    }
  }

  const renderDocRow = (config: MainDocConfig) => {
    const doc = findDocForConfig(config)

    return (
      <Paper
        key={config.id}
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          backgroundColor: DASHBOARD_TOKENS.surface,
          transition: 'all 0.2s',
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}>
            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <Tooltip title={config.tooltip || ''}>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, cursor: config.tooltip ? 'help' : 'default' }}>
                  {config.title}
                </Typography>
              </Tooltip>
              {doc ? (
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem', mt: 0.3 }} noWrap title={doc.originalFileName}>
                  (incarcat) · {doc.originalFileName}
                </Typography>
              ) : (
                <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.8rem', mt: 0.3 }}>
                  Lipsa
                </Typography>
              )}
            </div>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexShrink: 0 }}>
              {doc ? (
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
              ) : (
                <Chip
                  label="Lipsa"
                  size="small"
                  sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, ...statusChipSx('missing') }}
                />
              )}
              <IconButton
                size="small"
                aria-label="Incarca document"
                sx={{
                  borderRadius: DASHBOARD_TOKENS.radius.full,
                  color: DASHBOARD_TOKENS.primaryStrong,
                  backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                  '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16) },
                }}
              >
                <AddRoundedIcon fontSize="small" />
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
        </Stack>
      </Paper>
    )
  }

  const renderOtherDocList = (docsList: MockDocument[]) => {
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
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}>
              <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={doc.originalFileName}>
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
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      {/* Documente personale / PFA */}
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
            Documente personale / PFA
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
          </Button>
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
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
