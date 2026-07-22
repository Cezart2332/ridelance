import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import iconUpload from '../../assets/SVG/2- Regular/upload.svg'
import { TOKENS } from './onboardingTheme'

const isPdf = (f: File) => f.type === 'application/pdf'

/**
 * Zonă de upload pentru un document. Acceptă un PDF sau una ori mai multe
 * imagini (ex. față/verso) — imaginile multiple sunt combinate într-un singur
 * PDF la trimitere (vezi utils/imagesToPdf).
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
  const handlePick = (picked: File[]) => {
    if (picked.length === 0) return
    const pickedPdf = picked.find(isPdf)
    if (pickedPdf) {
      // Un PDF ține loc de document întreg — nu se combină cu altceva.
      onFilesChange([pickedPdf])
      return
    }
    // Imaginile se adaugă la cele deja selectate (un PDF existent e înlocuit).
    onFilesChange([...files.filter((f) => !isPdf(f)), ...picked])
  }

  const hasFiles = files.length > 0
  const boxText = !hasFiles
    ? placeholder ?? `Incarca ${label.toLowerCase()}`
    : files.length === 1
      ? files[0].name
      : `${files.length} imagini selectate — vor fi combinate într-un singur document`

  return (
    <Box>
      <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
        {label}
      </Typography>
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2.5,
          py: 1.8,
          borderRadius: `${TOKENS.radius.md}px`,
          border: `1.5px dashed ${hasFiles ? TOKENS.primary : TOKENS.borderHover}`,
          backgroundColor: hasFiles ? alpha(TOKENS.primary, 0.03) : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          '&:hover': disabled
            ? {}
            : {
                borderColor: TOKENS.primary,
                backgroundColor: alpha(TOKENS.primary, 0.02),
              },
        }}
      >
        {hasFiles ? (
          <CheckCircleOutlineRoundedIcon sx={{ color: TOKENS.primary, fontSize: 22 }} />
        ) : (
          <img
            src={iconUpload}
            alt="upload"
            style={{
              width: 22,
              height: 22,
              filter: 'invert(84%) sepia(21%) saturate(1450%) hue-rotate(167deg) brightness(98%) contrast(98%)',
              opacity: 0.7,
            }}
          />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ color: hasFiles ? TOKENS.ink : TOKENS.textMuted, fontWeight: hasFiles ? 600 : 500, fontSize: '0.92rem' }}
          >
            {boxText}
          </Typography>
          {!disabled && hasFiles && !isPdf(files[0]) && (
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.2 }}>
              Apasă pentru a adăuga încă o imagine (ex. verso)
            </Typography>
          )}
        </Box>
        <input
          type="file"
          hidden
          multiple
          accept="application/pdf,image/jpeg,image/png"
          disabled={disabled}
          onChange={(e) => {
            handlePick(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </Box>

      {files.length > 1 && (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {files.map((f, index) => (
            <Stack
              key={`${f.name}-${index}`}
              direction="row"
              sx={{ alignItems: 'center', gap: 1, pl: 0.5 }}
            >
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                Pagina {index + 1}:
              </Typography>
              <Typography noWrap sx={{ color: TOKENS.ink, fontSize: '0.8rem', minWidth: 0 }}>
                {f.name}
              </Typography>
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                  sx={{ p: 0.3 }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 15, color: TOKENS.textMuted }} />
                </IconButton>
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  )
}
