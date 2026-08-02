import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Alert, Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'

import { documentService, isAiPending, type DocumentSummary } from '../../services/document.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { buildUploadFile } from '../../utils/imagesToPdf'
import { MAX_UPLOAD_BYTES } from '../../utils/uploadValidation'
import { stateColors, TOKENS } from './onboardingTheme'
import { UploadField } from './UploadField'

interface DocumentFirstUploadProps {
  category: string
  label: string
  hint?: string
  /**
   * Categorii echivalente: un document încărcat în oricare dintre ele satisface cerința, exact
   * ca `AcceptedCategories` din `OnboardingSectionCatalog.cs`. Fără ele, un atestat urcat la
   * eligibilitate ar fi cerut din nou la ARR.
   */
  alsoAccepts?: string[]
  /** Numele pasului anterior de unde provine documentul, dacă nu e pasul curent. */
  fromStepLabel?: string
  documents: DocumentSummary[]
  pfaRegistrationId?: string | null
  /** Reîncarcă starea de onboarding după upload. */
  onUploaded?: () => void
}

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

/**
 * Bloc „document-first": utilizatorul DOAR încarcă documentul. Datele se citesc automat pe backend
 * (OCR) și se completează singure în dosar — userul nu confirmă nimic și nu așteaptă rezultatul.
 *
 * Cele două așteptări sunt separate vizual: uploadul (progres real, din axios) și prevalidarea
 * automată (după ce fișierul a ajuns). Dacă documentul e respins, motivul apare AICI, lângă
 * documentul respins — nu într-un banner global unde nu se știe la care se referă.
 */
export function DocumentFirstUpload({
  category,
  label,
  hint,
  alsoAccepts,
  fromStepLabel,
  documents,
  pfaRegistrationId,
  onUploaded,
}: DocumentFirstUploadProps) {
  const accepted = useMemo(() => [category, ...(alsoAccepts ?? [])], [category, alsoAccepts])
  const current = useMemo(
    () => documents.filter((d) => accepted.includes(d.category)).sort(byNewest)[0] ?? null,
    [documents, accepted],
  )

  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [replacing, setReplacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rejected =
    current !== null && (current.status.toLowerCase() === 'rejected' || current.aiStatus === 'Failed')
  const verifying = current !== null && !rejected && isAiPending(current)
  const uploading = progress !== null

  // Documentul a trecut, dar ceva citit din el nu s-a verificat (ex. CAEN ≠ 4939). Nu blocăm
  // nimic — spunem doar că se uită un om peste el, ca să nu pară că totul e în regulă.
  const needsHumanCheck = current !== null && !rejected && !verifying && current.aiRequiresManualReview

  // Documentul vine dintr-un pas anterior: îl arătăm bifat, nu îl mai cerem o dată.
  const reused = current !== null && !rejected && fromStepLabel !== undefined

  const upload = async () => {
    if (files.length === 0) return
    setProgress(0)
    setError(null)
    try {
      const file = await buildUploadFile(files, label)
      if (file.size > MAX_UPLOAD_BYTES) {
        setError('Documentul depășește 10 MB. Încarcă mai puține imagini sau imagini mai mici.')
        return
      }
      await documentService.upload(
        file,
        category,
        pfaRegistrationId ?? undefined,
        undefined,
        undefined,
        setProgress,
      )
      setFiles([])
      setReplacing(false)
      onUploaded?.()
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut încărca documentul.'))
    } finally {
      setProgress(null)
    }
  }

  const showUpload = !current || replacing || rejected
  const tone = rejected ? stateColors('danger') : verifying ? stateColors('pending') : null

  const statusChip = () => {
    if (!current) return null
    if (rejected) {
      return (
        <Chip
          size="small"
          icon={<ErrorOutlineRoundedIcon />}
          label="Respins — reîncarcă"
          color="error"
          sx={{ fontWeight: 700, fontSize: '0.68rem' }}
        />
      )
    }
    if (verifying) {
      return (
        <Chip
          size="small"
          icon={<AutorenewRoundedIcon />}
          label="Se verifică"
          sx={{ fontWeight: 700, fontSize: '0.68rem' }}
        />
      )
    }
    return (
      <Chip
        size="small"
        icon={<CheckCircleRoundedIcon />}
        label="Încărcat"
        color="success"
        sx={{ fontWeight: 700, fontSize: '0.68rem' }}
      />
    )
  }

  return (
    <Box
      sx={{
        // Documentul respins își poartă singur semnalul, ca între trei documente să fie evident care.
        ...(tone
          ? {
              borderLeft: `3px solid ${tone.border}`,
              pl: 1.75,
              backgroundColor: alpha(tone.fg, 0.02),
              borderRadius: `${TOKENS.radius.sm}px`,
              py: 1,
            }
          : {}),
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, color: TOKENS.ink, fontSize: '0.95rem' }}>{label}</Typography>
        {statusChip()}
      </Stack>

      {hint && <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.83rem', mb: 1 }}>{hint}</Typography>}
      {error && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {rejected && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          {current?.aiSummary ?? 'Documentul a fost respins. Încarcă o variantă corectă mai jos.'}
        </Alert>
      )}

      {/* Verificarea automată e o stare separată de upload: fișierul a ajuns, acum se citește. */}
      {verifying && (
        <Box sx={{ mb: 1.2 }}>
          <Typography sx={{ fontSize: '0.8rem', color: TOKENS.pending, fontWeight: 600, mb: 0.6 }}>
            Documentul a ajuns. Îl verificăm automat — poți continua între timp.
          </Typography>
          <LinearProgress
            sx={{
              height: 3,
              borderRadius: TOKENS.radius.full,
              backgroundColor: alpha(TOKENS.pendingBase, 0.15),
              '& .MuiLinearProgress-bar': { backgroundColor: TOKENS.pending },
            }}
          />
        </Box>
      )}

      {needsHumanCheck && (
        <Alert severity="warning" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          Am încărcat documentul, dar ceva din el nu se potrivește cu ce așteptam. Îl verifică un coleg — nu
          trebuie să faci nimic.
        </Alert>
      )}

      {current && !replacing && !rejected && (
        <Box>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography sx={{ flex: 1, color: TOKENS.textMuted, fontSize: '0.85rem' }} noWrap>
              {current.originalFileName}
            </Typography>
            <Button size="small" onClick={() => setReplacing(true)} sx={{ color: TOKENS.textMuted }}>
              Înlocuiește
            </Button>
          </Stack>
          {reused && (
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.2 }}>
              Același document ca la pasul „{fromStepLabel}" — se încarcă o singură dată.
            </Typography>
          )}
        </Box>
      )}

      {showUpload && (
        <Stack spacing={1.2}>
          <UploadField
            label={current ? 'Încarcă o versiune nouă' : 'Încarcă documentul'}
            files={files}
            onFilesChange={setFiles}
            disabled={uploading}
          />

          {uploading && (
            <Box>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted, fontWeight: 600 }}>
                  Se încarcă…
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.78rem',
                    color: TOKENS.textMuted,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress ?? 0}
                sx={{ height: 5, borderRadius: TOKENS.radius.full }}
              />
            </Box>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={upload}
              disabled={files.length === 0 || uploading}
              sx={{
                fontWeight: 700,
                backgroundColor: TOKENS.primary,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              {uploading ? 'Se încarcă...' : 'Încarcă'}
            </Button>
            {replacing && (
              <Button
                disabled={uploading}
                onClick={() => {
                  setReplacing(false)
                  setFiles([])
                }}
                sx={{ color: TOKENS.textMuted }}
              >
                Renunță
              </Button>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
