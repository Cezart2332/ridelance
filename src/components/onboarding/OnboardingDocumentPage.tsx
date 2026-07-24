import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { EXPIRABLE_CATEGORIES, getOnboardingSection } from '../../constants/documentSections'
import { documentService, isAiPending, type DocumentSummary } from '../../services/document.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { buildUploadFile } from '../../utils/imagesToPdf'
import ExtractedFieldsPanel from './ExtractedFieldsPanel'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, inputSx } from './onboardingTheme'
import { UploadField } from './UploadField'
import { useOnboardingState } from './useOnboardingState'

function docStatusChip(doc: DocumentSummary) {
  const s = doc.status.toLowerCase()
  if (s === 'verified' || s === 'approved') {
    return { label: 'Verificat', sx: { borderColor: alpha('#2e7d32', 0.2), color: '#2e7d32', backgroundColor: alpha('#2e7d32', 0.08) } }
  }
  if (s === 'pending') {
    if (isAiPending(doc)) {
      return { label: 'În verificare automată', sx: { borderColor: alpha(TOKENS.primary, 0.3), color: TOKENS.primaryStrong, backgroundColor: alpha(TOKENS.primary, 0.08) } }
    }
    return { label: 'În aprobare', sx: { borderColor: alpha('#ed6c02', 0.2), color: '#b54708', backgroundColor: alpha('#ed6c02', 0.1) } }
  }
  return { label: 'Respins', sx: { borderColor: alpha('#d32f2f', 0.2), color: '#b71c1c', backgroundColor: alpha('#d32f2f', 0.08) } }
}

export default function OnboardingDocumentPage() {
  const navigate = useNavigate()
  const { sectionKey, docId } = useParams<{ sectionKey: string; docId: string }>()
  const { state, documents, loading, refresh } = useOnboardingState()

  const section = getOnboardingSection(sectionKey)
  const docConfig = section?.docs?.find((d) => d.id === docId)
  const sectionState = state?.sections.find((s) => s.key === section?.key)
  const status = sectionState?.status ?? 'Locked'

  const sectionPath = section ? `/onboarding/sections/${section.key}` : '/onboarding'

  useEffect(() => {
    if (!section || !docConfig) {
      navigate('/onboarding', { replace: true })
      return
    }
    if (!loading && state && status === 'Locked') {
      navigate('/onboarding', { replace: true })
    }
  }, [section, docConfig, loading, state, status, navigate])

  const existingDocs = useMemo(
    () =>
      documents
        .filter((d) => docConfig?.categories.includes(d.category))
        .sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()),
    [documents, docConfig],
  )
  const currentDoc = existingDocs.find((d) => d.status.toLowerCase() !== 'rejected') ?? existingDocs[0] ?? null

  const isExpirable = docConfig ? EXPIRABLE_CATEGORIES.has(docConfig.primaryCategory) : false
  // Un document respins (de AI sau de admin) poate fi reîncărcat chiar dacă
  // secțiunea e deja trimisă la validare — altfel userul rămâne blocat.
  const currentDocRejected = currentDoc?.status.toLowerCase() === 'rejected'
  const readOnly =
    status === 'Validated' || (status === 'AwaitingValidation' && !currentDocRejected)

  const [files, setFiles] = useState<File[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!docConfig || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const uploadFile = await buildUploadFile(files, docConfig.title)
      if (uploadFile.size > 10 * 1024 * 1024) {
        setError('Documentul rezultat depășește 10 MB. Încarcă mai puține imagini sau imagini mai mici.')
        return
      }
      await documentService.upload(
        uploadFile,
        docConfig.primaryCategory,
        state?.pfaRegistrationId ?? undefined,
        undefined,
        isExpirable && expiresAt ? new Date(expiresAt).toISOString() : undefined,
      )
      setFiles([])
      setExpiresAt('')
      setSnackbar('Documentul a fost încărcat!')
      await refresh()
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut încărca documentul. Încearcă din nou.'))
    } finally {
      setUploading(false)
    }
  }

  if (loading || !section || !docConfig) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: TOKENS.surface }}>
        <CircularProgress sx={{ color: TOKENS.primary }} />
      </Box>
    )
  }

  return (
    <OnboardingLayout state={state} activeKey={section.key}>
      <Stack spacing={2.5}>
        <Box>
          <Button
            onClick={() => navigate(sectionPath)}
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 17 }} />}
            sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted, mb: 1, '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' } }}
          >
            {section.label}
          </Button>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: TOKENS.ink }}>
            {docConfig.title}
          </Typography>
          {(docConfig.tooltip || docConfig.complianceNote) && (
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', mt: 0.5 }}>
              {docConfig.tooltip}
              {docConfig.tooltip && docConfig.complianceNote ? ' ' : ''}
              {docConfig.complianceNote}
            </Typography>
          )}
        </Box>

        {/* Documentul curent */}
        {currentDoc && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: `${TOKENS.radius.lg}px`,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.paper,
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 650, fontSize: '0.92rem', color: TOKENS.ink }} noWrap>
                  {currentDoc.originalFileName}
                </Typography>
                <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.2 }}>
                  Încărcat la {new Date(currentDoc.uploadedAtUtc).toLocaleDateString('ro-RO')}
                  {currentDoc.expiresAtUtc
                    ? ` · Expiră la ${new Date(currentDoc.expiresAtUtc).toLocaleDateString('ro-RO')}`
                    : ''}
                </Typography>
              </Box>
              <Chip
                size="small"
                variant="outlined"
                label={docStatusChip(currentDoc).label}
                sx={{ fontWeight: 700, fontSize: '0.72rem', flexShrink: 0, ...docStatusChip(currentDoc).sx }}
              />
              <Tooltip title="Vizualizează">
                <IconButton
                  size="small"
                  onClick={() => void documentService.openInNewTab(currentDoc.id, currentDoc.originalFileName)}
                >
                  <VisibilityRoundedIcon sx={{ fontSize: 19 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Descarcă">
                <IconButton
                  size="small"
                  onClick={() => void documentService.downloadAndSave(currentDoc.id, currentDoc.originalFileName)}
                >
                  <DownloadRoundedIcon sx={{ fontSize: 19 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        )}

        {currentDoc && currentDoc.status.toLowerCase() === 'pending' && isAiPending(currentDoc) && (
          <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Documentul este verificat automat în fundal — poți continua cu celelalte documente. Te
            anunțăm dacă e nevoie să-l reîncarci.
          </Alert>
        )}

        {currentDoc?.status.toLowerCase() === 'rejected' && (
          <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            {currentDoc.aiStatus === 'Failed' && currentDoc.aiSummary
              ? `Documentul a fost respins la verificarea automată: ${currentDoc.aiSummary} Încarcă o variantă corectată mai jos.`
              : 'Documentul a fost respins. Încarcă o variantă corectată mai jos.'}
          </Alert>
        )}

        {/* Datele precompletate din OCR — confirmare/corectare de către client */}
        {currentDoc && currentDoc.status.toLowerCase() !== 'rejected' && (
          <ExtractedFieldsPanel documentId={currentDoc.id} readOnly={readOnly} />
        )}

        {/* Upload */}
        {readOnly ? (
          <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            {status === 'Validated'
              ? 'Secțiunea a fost validată — documentul nu mai poate fi modificat.'
              : 'Secțiunea este în validare — documentul nu mai poate fi modificat până la răspunsul echipei.'}
          </Alert>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: `${TOKENS.radius.lg}px`,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.paper,
            }}
          >
            <Stack spacing={2.5}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                  {error}
                </Alert>
              )}

              <UploadField
                label={currentDoc ? 'Încarcă o versiune nouă' : 'Încarcă documentul'}
                placeholder="PDF sau una ori mai multe imagini JPG/PNG (max. 10 MB)"
                files={files}
                onFilesChange={setFiles}
                disabled={uploading}
              />

              {isExpirable && (
                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Data de expirare a documentului{' '}
                    <Box component="span" sx={{ color: TOKENS.textMuted, fontWeight: 500, fontSize: '0.82rem' }}>
                      (opțional — o citim automat din document)
                    </Box>
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    sx={inputSx}
                    slotProps={{ htmlInput: { min: new Date().toISOString().split('T')[0] } }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                disabled={files.length === 0 || uploading}
                onClick={handleUpload}
                sx={{
                  py: 1.3,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: `${TOKENS.radius.md}px`,
                  color: '#fff',
                  backgroundColor: TOKENS.primary,
                  boxShadow: TOKENS.shadow.glow,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong },
                  '&.Mui-disabled': { backgroundColor: alpha(TOKENS.primary, 0.4), color: '#fff' },
                }}
              >
                {uploading ? 'Se încarcă...' : 'Salvează documentul'}
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </OnboardingLayout>
  )
}
