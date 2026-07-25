import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  documentService,
  isAiPending,
  type DocumentSummary,
  type ExtractedField,
} from '../../services/document.service'
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
  /** Câmpurile extrase (OCR) ale documentului — folosite de părinte pentru precompletare. */
  onExtracted: (fields: ExtractedField[]) => void
  /** Reîncarcă starea de onboarding (ca lista de documente să reflecte noul upload). */
  onUploaded?: () => void
}

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

/**
 * Bloc „document-first": întâi încarci documentul, OCR-ul citește datele și părintele precompletează
 * câmpurile pentru confirmare. Dacă OCR-ul nu e disponibil, câmpurile rămân editabile manual.
 */
export function DocumentFirstUpload({
  category,
  label,
  hint,
  documents,
  pfaRegistrationId,
  onExtracted,
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

  const onExtractedRef = useRef(onExtracted)
  onExtractedRef.current = onExtracted
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Citește câmpurile extrase pentru documentul curent; dacă AI-ul e încă în lucru, mai încearcă.
  useEffect(() => {
    if (!current) return
    let attempts = 0

    const fetchFields = async () => {
      try {
        const r = await documentService.getExtractedFields(current.id)
        if (r.fields.length > 0) {
          onExtractedRef.current(r.fields)
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }
      } catch {
        // documentul poate să nu aibă câmpuri extrase — nu e o eroare vizibilă
      }
    }

    void fetchFields()
    if (isAiPending(current)) {
      pollRef.current = setInterval(() => {
        attempts += 1
        if (attempts > 8) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          return
        }
        void fetchFields()
      }, 3000)
    }

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [current?.id, current?.aiStatus]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const showUpload = !current || replacing

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.8 }}>
        <Typography sx={{ fontWeight: 700, color: TOKENS.ink, fontSize: '0.95rem' }}>{label}</Typography>
        {current && (
          <Chip
            size="small"
            icon={isAiPending(current) ? undefined : <CheckCircleRoundedIcon />}
            label={isAiPending(current) ? 'Se citește...' : 'Încărcat'}
            sx={{ fontWeight: 700, fontSize: '0.68rem' }}
            color={isAiPending(current) ? 'default' : 'success'}
          />
        )}
      </Stack>

      {hint && <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.83rem', mb: 1 }}>{hint}</Typography>}
      {error && <Alert severity="error" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

      {current && !replacing && (
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
