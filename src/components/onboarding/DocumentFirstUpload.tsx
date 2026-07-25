import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

import { documentService, isAiPending, type DocumentSummary } from '../../services/document.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { buildUploadFile } from '../../utils/imagesToPdf'
import { TOKENS } from './onboardingTheme'
import { UploadField } from './UploadField'

interface DocumentFirstUploadProps {
  category: string
  label: string
  hint?: string
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
 * Dacă documentul nu e bun, primește email cu motivul și îl reîncarcă aici.
 */
export function DocumentFirstUpload({
  category,
  label,
  hint,
  documents,
  pfaRegistrationId,
  onUploaded,
}: DocumentFirstUploadProps) {
  const current = useMemo(
    () => documents.filter((d) => d.category === category).sort(byNewest)[0] ?? null,
    [documents, category],
  )

  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rejected = current?.status.toLowerCase() === 'rejected'

  const upload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const file = await buildUploadFile(files, label)
      if (file.size > 10 * 1024 * 1024) {
        setError('Documentul depășește 10 MB. Încarcă mai puține imagini sau imagini mai mici.')
        return
      }
      await documentService.upload(file, category, pfaRegistrationId ?? undefined)
      setFiles([])
      setReplacing(false)
      onUploaded?.()
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut încărca documentul.'))
    } finally {
      setUploading(false)
    }
  }

  const showUpload = !current || replacing || rejected

  const statusChip = () => {
    if (!current) return null
    if (rejected) return <Chip size="small" label="Respins — reîncarcă" color="error" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
    if (isAiPending(current)) return <Chip size="small" label="Se verifică automat" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
    return <Chip size="small" icon={<CheckCircleRoundedIcon />} label="Încărcat" color="success" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.8 }}>
        <Typography sx={{ fontWeight: 700, color: TOKENS.ink, fontSize: '0.95rem' }}>{label}</Typography>
        {statusChip()}
      </Stack>

      {hint && <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.83rem', mb: 1 }}>{hint}</Typography>}
      {error && <Alert severity="error" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

      {rejected && current?.aiSummary && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          {current.aiSummary}
        </Alert>
      )}

      {current && !replacing && !rejected && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Typography sx={{ flex: 1, color: TOKENS.textMuted, fontSize: '0.85rem' }} noWrap>
            {current.originalFileName}
          </Typography>
          <Button size="small" onClick={() => setReplacing(true)} sx={{ textTransform: 'none', color: TOKENS.textMuted }}>
            Înlocuiește
          </Button>
        </Stack>
      )}

      {showUpload && (
        <Stack spacing={1.2}>
          <UploadField
            label={current ? 'Încarcă o versiune nouă' : 'Încarcă documentul'}
            placeholder="PDF sau imagini JPG/PNG (max. 10 MB)"
            files={files}
            onFilesChange={setFiles}
            disabled={uploading}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={upload}
              disabled={files.length === 0 || uploading}
              sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}
            >
              {uploading ? 'Se încarcă...' : 'Încarcă'}
            </Button>
            {replacing && (
              <Button onClick={() => { setReplacing(false); setFiles([]) }} sx={{ textTransform: 'none', color: TOKENS.textMuted }}>
                Renunță
              </Button>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
