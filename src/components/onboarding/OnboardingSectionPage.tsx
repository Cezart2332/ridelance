import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOnboardingSection, type MainDocConfig } from '../../constants/documentSections'
import { isAiPending, type DocumentSummary } from '../../services/document.service'
import { onboardingService } from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, sectionStatusChipSx, sectionStatusLabel } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

function bestDocumentFor(config: MainDocConfig, documents: DocumentSummary[]): DocumentSummary | null {
  const matching = documents
    .filter((d) => config.categories.includes(d.category))
    .sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())
  return matching.find((d) => d.status.toLowerCase() !== 'rejected') ?? matching[0] ?? null
}

function docStatusChip(doc: DocumentSummary | null) {
  if (!doc) {
    return { label: 'Lipsă', sx: { borderColor: TOKENS.border, color: TOKENS.textMuted, backgroundColor: alpha(TOKENS.ink, 0.04) } }
  }
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

export default function OnboardingSectionPage() {
  const navigate = useNavigate()
  const { sectionKey } = useParams<{ sectionKey: string }>()
  const { state, documents, loading, refresh } = useOnboardingState()

  const section = getOnboardingSection(sectionKey)
  const sectionState = state?.sections.find((s) => s.key === section?.key)
  const status = sectionState?.status ?? 'Locked'

  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Secțiune inexistentă / PFA / blocată → înapoi la hub
  useEffect(() => {
    if (!section || section.key === 'Pfa') {
      navigate(section ? '/onboarding/pfa' : '/onboarding', { replace: true })
      return
    }
    if (!loading && state && status === 'Locked') {
      navigate('/onboarding', { replace: true })
    }
  }, [section, loading, state, status, navigate])

  const requiredDocs = useMemo(
    () => (section?.docs ?? []).filter((d) => !(section?.optionalDocIds ?? []).includes(d.id)),
    [section],
  )
  const uploadedRequired = requiredDocs.filter((d) => {
    const doc = bestDocumentFor(d, documents)
    return doc !== null && doc.status.toLowerCase() !== 'rejected'
  }).length
  const allRequiredUploaded = uploadedRequired === requiredDocs.length
  const canSubmit =
    allRequiredUploaded && (status === 'InProgress' || status === 'Rejected') && !submitting

  const handleSubmit = async () => {
    if (!section) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onboardingService.submitSection(section.key)
      setSnackbar('Secțiunea a fost trimisă la validare. Te anunțăm când e verificată!')
      await refresh()
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Nu am putut trimite secțiunea la validare. Încearcă din nou.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !section || section.key === 'Pfa') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: TOKENS.surface }}>
        <CircularProgress sx={{ color: TOKENS.primary }} />
      </Box>
    )
  }

  const readOnly = status === 'AwaitingValidation' || status === 'Validated'

  return (
    <OnboardingLayout state={state} activeKey={section.key}>
      <Stack spacing={2.5}>
        <Box>
          <Button
            onClick={() => navigate('/onboarding')}
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 17 }} />}
            sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted, mb: 1, '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' } }}
          >
            Toți pașii
          </Button>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: TOKENS.ink }}>
              Pasul {section.order}: {section.label}
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              label={sectionStatusLabel(status)}
              sx={{ fontWeight: 700, fontSize: '0.72rem', ...sectionStatusChipSx(status) }}
            />
          </Stack>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', mt: 0.5 }}>
            {section.description} Apasă pe un document pentru a-l încărca.
          </Typography>
        </Box>

        {status === 'Rejected' && sectionState?.note && (
          <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Secțiunea a fost respinsă: {sectionState.note}
          </Alert>
        )}
        {status === 'AwaitingValidation' && (
          <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Secțiunea este în validare la echipa RIDElance. Documentele nu mai pot fi modificate până la răspuns.
          </Alert>
        )}
        {status === 'Validated' && (
          <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Secțiunea a fost validată!
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: `${TOKENS.radius.lg}px`,
            border: `1px solid ${TOKENS.border}`,
            backgroundColor: TOKENS.paper,
            overflow: 'hidden',
          }}
        >
          {(section.docs ?? []).map((docConfig, index) => {
            const doc = bestDocumentFor(docConfig, documents)
            const chip = docStatusChip(doc)
            const optional = (section.optionalDocIds ?? []).includes(docConfig.id)
            return (
              <ButtonBase
                key={docConfig.id}
                onClick={() => navigate(`/onboarding/sections/${section.key}/documents/${docConfig.id}`)}
                sx={{
                  width: '100%',
                  display: 'block',
                  textAlign: 'left',
                  px: 2.5,
                  py: 2,
                  borderTop: index > 0 ? `1px solid ${TOKENS.border}` : 'none',
                  '&:hover': { backgroundColor: alpha(TOKENS.primary, 0.02) },
                }}
              >
                <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 650, fontSize: '0.92rem', color: TOKENS.ink }}>
                      {docConfig.title}
                      {optional && (
                        <Box component="span" sx={{ ml: 1, color: TOKENS.textMuted, fontWeight: 500, fontSize: '0.78rem' }}>
                          (după caz)
                        </Box>
                      )}
                    </Typography>
                    {doc && (
                      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.2 }} noWrap>
                        {doc.originalFileName}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={chip.label}
                    sx={{ fontWeight: 700, fontSize: '0.72rem', flexShrink: 0, ...chip.sx }}
                  />
                  <ChevronRightRoundedIcon sx={{ color: TOKENS.textMuted, flexShrink: 0 }} />
                </Stack>
              </ButtonBase>
            )
          })}
        </Paper>

        {submitError && (
          <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            {submitError}
          </Alert>
        )}

        {!readOnly && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: `${TOKENS.radius.lg}px`,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.paper,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}
            >
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem', fontWeight: 600 }}>
                {uploadedRequired}/{requiredDocs.length} documente obligatorii încărcate
                {!allRequiredUploaded && ' — încarcă-le pe toate pentru a trimite la validare.'}
              </Typography>
              <Button
                variant="contained"
                disabled={!canSubmit}
                endIcon={<SendRoundedIcon sx={{ fontSize: 17 }} />}
                onClick={handleSubmit}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: `${TOKENS.radius.md}px`,
                  px: 3,
                  py: 1.1,
                  color: '#fff',
                  backgroundColor: TOKENS.primary,
                  boxShadow: TOKENS.shadow.glow,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong },
                  '&.Mui-disabled': { backgroundColor: alpha(TOKENS.primary, 0.4), color: '#fff' },
                }}
              >
                {submitting ? 'Se trimite...' : 'Trimite spre validare'}
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </OnboardingLayout>
  )
}
