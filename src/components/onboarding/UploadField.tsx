import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { visuallyHidden } from '@mui/utils'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { ACCEPTED_TYPES } from '../../utils/uploadValidation'
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
 * Calitatea pozei nu se judecă aici: fișierul pleacă la server, iar OCR-ul spune dacă nu se
 * poate citi.
 *
 * Are două moduri, după cine deține fișierul:
 * - **imediat** (`onPick`): fișierul pleacă spre server de îndată ce a fost ales. Fără listă de
 *   așteptare, fără buton — părintele arată progresul.
 * - **amânat** (`files` + `onFilesChange`): fișierul rămâne aici, cu previzualizare, până când
 *   formularul din jur e trimis (ex. certificatul PFA, care merge împreună cu numele și telefonul).
 */
export function UploadField({
  label,
  files,
  onFilesChange,
  onPick,
  hideLabel = false,
  disabled = false,
}: {
  label: string
  files?: File[]
  onFilesChange?: (files: File[]) => void
  /** Fișierele valide, imediat ce au fost alese. Prezența lui înseamnă upload automat. */
  onPick?: (files: File[]) => void
  /** Eticheta rămâne doar pentru cititoarele de ecran, când deasupra există deja un titlu. */
  hideLabel?: boolean
  disabled?: boolean
}) {
  const inputId = useId()
  const cameraRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const selected = files ?? []

  const handlePick = (picked: File[]) => {
    if (picked.length === 0) return

    const pickedPdf = picked.find(isPdf)
    // Un PDF ține loc de document întreg — nu se combină cu altceva.
    const images = picked.filter((f) => !isPdf(f))

    // Modul imediat nu acumulează: ce s-a ales acum e documentul care pleacă.
    onPick?.(pickedPdf ? [pickedPdf] : images)

    if (pickedPdf) {
      onFilesChange?.([pickedPdf])
      return
    }
    // Imaginile se adaugă la cele deja selectate (un PDF existent e înlocuit).
    onFilesChange?.([...selected.filter((f) => !isPdf(f)), ...images])
  }

  const hasFiles = selected.length > 0

  return (
    <Box>
      <Typography
        component="label"
        htmlFor={inputId}
        sx={
          hideLabel
            ? visuallyHidden
            : { display: 'block', mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }
        }
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
          handlePick(Array.from(e.dataTransfer.files))
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
                handlePick(Array.from(e.target.files ?? []))
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
              handlePick(Array.from(e.target.files ?? []))
              e.target.value = ''
            }}
          />
        </Stack>

      </Box>

      {hasFiles && (
        <Stack spacing={0.8} sx={{ mt: 1 }}>
          {selected.map((file, index) => (
            <FilePreview
              key={`${file.name}-${index}`}
              file={file}
              index={index}
              total={selected.length}
              disabled={disabled}
              onRemove={() => onFilesChange?.(selected.filter((_, i) => i !== index))}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
