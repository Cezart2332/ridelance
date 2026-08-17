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
  /**
   * Categorii echivalente: un document încărcat în oricare dintre ele satisface cerința, exact
   * ca `AcceptedCategories` din `OnboardingSectionCatalog.cs`. Fără ele, un atestat urcat la
   * eligibilitate ar fi cerut din nou la ARR.
   */
  alsoAccepts?: string[]
  /** Numele pasului anterior de unde provine documentul, dacă nu e pasul curent. */
  fromStepLabel?: string
  /**
   * Documentul are informații pe ambele fețe (CIV): cerem două imagini, care se combină într-un
   * singur PDF. Un PDF încărcat direct se acceptă ca atare — nu-i putem număra paginile aici.
   */
  requireBothSides?: boolean
  documents: DocumentSummary[]
  pfaRegistrationId?: string | null
  /** Reîncarcă starea de onboarding după upload. */
  onUploaded?: () => void
  /**
   * Utilizatorul a cerut înlocuirea fișierului. Ecranul care avansează automat după un upload
   * reușit își anulează tranziția pe semnalul ăsta — altfel ar pleca de sub el fix când începe
   * o corectură (spec fix-uri §6).
   */
  onReplaceStarted?: () => void
  /** Documentul e singurul lucru de pe ecran: zonă de upload mare, cu instrucțiune. */
  spacious?: boolean
  /** Ce trebuie să se vadă în document. Apare în zona de upload, doar în modul `spacious`. */
  hint?: string
  /** Titlul e deja pe card (micro-pas de upload) — nu-l repetăm deasupra zonei de upload. */
  hideLabel?: boolean
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
  alsoAccepts,
  fromStepLabel,
  requireBothSides = false,
  documents,
  pfaRegistrationId,
  onUploaded,
  onReplaceStarted,
  spacious = false,
  hint,
  hideLabel = false,
}: DocumentFirstUploadProps) {
  const accepted = useMemo(() => [category, ...(alsoAccepts ?? [])], [category, alsoAccepts])
  const current = useMemo(
    () => documents.filter((d) => accepted.includes(d.category)).sort(byNewest)[0] ?? null,
    [documents, accepted],
  )

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

  /** Fișierul ales pleacă imediat: nu există pas de confirmare, deci nici buton de „Încarcă". */
  const upload = async (picked: File[]) => {
    if (picked.length === 0) return

    if (requireBothSides && picked.length < 2 && !picked.some((f) => f.type === 'application/pdf')) {
      setError('Încarcă ambele fețe: alege două poze deodată (față și verso) sau un PDF cu ambele.')
      return
    }

    setProgress(0)
    setError(null)
    try {
      const file = await buildUploadFile(picked, label)
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
        {!hideLabel && (
          <Typography sx={{ fontWeight: 700, color: TOKENS.ink, fontSize: '0.95rem' }}>{label}</Typography>
        )}
        {statusChip()}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {rejected && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          {current?.aiSummary ?? 'Document respins. Încarcă altul.'}
        </Alert>
      )}

      {/* Verificarea automată e o stare separată de upload: fișierul a ajuns, acum se citește.
          Chip-ul „Se verifică" o numește deja — aici rămâne doar bara. */}
      {verifying && (
        <LinearProgress
          sx={{
            mb: 1.2,
            height: 3,
            borderRadius: TOKENS.radius.full,
            backgroundColor: alpha(TOKENS.pendingBase, 0.15),
            '& .MuiLinearProgress-bar': { backgroundColor: TOKENS.pending },
          }}
        />
      )}

      {needsHumanCheck && (
        <Alert severity="warning" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          Îl verificăm manual. Nu trebuie să faci nimic.
        </Alert>
      )}

      {current && !replacing && !rejected && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Typography sx={{ flex: 1, color: TOKENS.textMuted, fontSize: '0.85rem' }} noWrap>
            {reused ? `${current.originalFileName} · de la „${fromStepLabel}”` : current.originalFileName}
          </Typography>
          <Button
            size="small"
            onClick={() => {
              setReplacing(true)
              onReplaceStarted?.()
            }}
            sx={{ color: TOKENS.textMuted }}
          >
            Înlocuiește fișierul
          </Button>
        </Stack>
      )}

      {showUpload && (
        <Stack spacing={1.2}>
          <UploadField
            label={current ? `Încarcă o versiune nouă: ${label}` : `Încarcă: ${label}`}
            hideLabel
            spacious={spacious}
            hint={hint}
            onPick={(picked) => void upload(picked)}
            disabled={uploading}
          />

          {uploading && (
            <LinearProgress
              variant="determinate"
              value={progress ?? 0}
              sx={{ height: 5, borderRadius: TOKENS.radius.full }}
            />
          )}

          {replacing && !uploading && (
            <Button
              onClick={() => setReplacing(false)}
              sx={{ alignSelf: 'flex-start', color: TOKENS.textMuted }}
            >
              Renunță
            </Button>
          )}
        </Stack>
      )}
    </Box>
  )
}
