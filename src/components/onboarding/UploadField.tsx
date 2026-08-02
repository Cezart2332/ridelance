import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { ACCEPTED_TYPES, validateUploadFiles } from '../../utils/uploadValidation'
import { TOKENS } from './onboardingTheme'

const isPdf = (f: File) => f.type === 'application/pdf'

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

/** Miniatura unei imagini selectate, cu opțiune de refacere înainte de trimitere. */
function FilePreview({
  file,
  index,
  total,
  onRemove,
  disabled,
}: {
  file: File
  index: number
  total: number
  onRemove: () => void
  disabled: boolean
}) {
  const url = useMemo(() => (isPdf(file) ? null : URL.createObjectURL(file)), [file])

  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 1.5,
        p: 1,
        borderRadius: `${TOKENS.radius.md}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          flexShrink: 0,
          borderRadius: `${TOKENS.radius.sm}px`,
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: alpha(TOKENS.ink, 0.04),
        }}
      >
        {url ? (
          <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <DescriptionRoundedIcon sx={{ color: TOKENS.textMuted }} />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: '0.85rem', fontWeight: 600, color: TOKENS.ink }}>
          {file.name}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: TOKENS.textMuted, fontVariantNumeric: 'tabular-nums' }}>
          {total > 1 ? `Pagina ${index + 1} · ` : ''}
          {formatSize(file.size)}
        </Typography>
      </Box>

      {!disabled && (
        <IconButton size="small" onClick={onRemove} aria-label={`Șterge ${file.name}`}>
          <CloseRoundedIcon sx={{ fontSize: 17, color: TOKENS.textMuted }} />
        </IconButton>
      )}
    </Stack>
  )
}

/**
 * Zonă de upload pentru un document: drag & drop, alegere din fișiere sau poză făcută pe loc.
 * Acceptă un PDF ori una sau mai multe imagini (față/verso) — imaginile multiple sunt combinate
 * într-un singur PDF la trimitere (vezi utils/imagesToPdf).
 *
 * Validarea (mărime, format, rezoluție, luminozitate) rulează la selecție, nu la trimitere, ca
 * driverul să afle imediat că trebuie să refacă poza.
 */
export function UploadField({
  label,
  files,
  onFilesChange,
  placeholder,
  disabled = false,
}: {
  label: string
  files: File[]
  onFilesChange: (files: File[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const inputId = useId()
  const cameraRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [issues, setIssues] = useState<string[]>([])

  const handlePick = async (picked: File[]) => {
    if (picked.length === 0) return

    const problems = await validateUploadFiles(picked)
    setIssues([...new Set(problems.map((p) => p.message))])

    const usable = picked.filter((file) => !problems.some((p) => p.file === file))
    if (usable.length === 0) return

    const pickedPdf = usable.find(isPdf)
    if (pickedPdf) {
      // Un PDF ține loc de document întreg — nu se combină cu altceva.
      onFilesChange([pickedPdf])
      return
    }
    // Imaginile se adaugă la cele deja selectate (un PDF existent e înlocuit).
    onFilesChange([...files.filter((f) => !isPdf(f)), ...usable])
  }

  const hasFiles = files.length > 0

  return (
    <Box>
      <Typography
        component="label"
        htmlFor={inputId}
        sx={{ display: 'block', mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}
      >
        {label}
      </Typography>

      <Box
        onDragOver={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragging(false)
          void handlePick(Array.from(e.dataTransfer.files))
        }}
        sx={{
          borderRadius: `${TOKENS.radius.md}px`,
          border: `1.5px dashed ${dragging || hasFiles ? TOKENS.primary : TOKENS.borderHover}`,
          backgroundColor: dragging ? alpha(TOKENS.primary, 0.06) : TOKENS.paper,
          transition: `border-color ${TOKENS.duration}, background-color ${TOKENS.duration}`,
          opacity: disabled ? 0.6 : 1,
          p: 1.5,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'stretch' }}>
          {/* Butonul de fișiere e un <label> peste un input real — rămâne accesibil din tastatură. */}
          <Button
            component="label"
            htmlFor={inputId}
            disabled={disabled}
            startIcon={<UploadFileRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{ flex: 1, fontWeight: 650, color: TOKENS.ink, justifyContent: 'center' }}
          >
            Alege fișier
            <input
              id={inputId}
              type="file"
              hidden
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              disabled={disabled}
              onChange={(e) => {
                void handlePick(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />
          </Button>

          <Button
            onClick={() => cameraRef.current?.click()}
            disabled={disabled}
            startIcon={<PhotoCameraRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{ flex: 1, fontWeight: 650, color: TOKENS.ink, justifyContent: 'center' }}
          >
            Fă poză
          </Button>
          <input
            ref={cameraRef}
            type="file"
            hidden
            accept="image/*"
            capture="environment"
            disabled={disabled}
            onChange={(e) => {
              void handlePick(Array.from(e.target.files ?? []))
              e.target.value = ''
            }}
          />
        </Stack>

        {!hasFiles && (
          <Typography sx={{ mt: 0.8, textAlign: 'center', fontSize: '0.78rem', color: TOKENS.textMuted }}>
            {placeholder ?? 'Trage fișierul aici, alege-l sau fotografiază-l. PDF, JPG sau PNG, max. 10 MB.'}
          </Typography>
        )}
      </Box>

      {issues.length > 0 && (
        <Stack spacing={0.8} sx={{ mt: 1 }}>
          {issues.map((issue) => (
            <Alert key={issue} severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px`, py: 0.2 }}>
              {issue}
            </Alert>
          ))}
        </Stack>
      )}

      {hasFiles && (
        <Stack spacing={0.8} sx={{ mt: 1 }}>
          {files.map((file, index) => (
            <FilePreview
              key={`${file.name}-${index}`}
              file={file}
              index={index}
              total={files.length}
              disabled={disabled}
              onRemove={() => onFilesChange(files.filter((_, i) => i !== index))}
            />
          ))}
          {!isPdf(files[0]) && (
            <Typography sx={{ fontSize: '0.76rem', color: TOKENS.textMuted, pl: 0.5 }}>
              Mai ai și versoul? Adaugă-l — le combinăm într-un singur document.
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  )
}
