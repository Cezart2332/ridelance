import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import iconUpload from '../../assets/SVG/2- Regular/upload.svg'
import { TOKENS } from './onboardingTheme'

export function UploadField({
  label,
  file,
  onFileChange,
  placeholder,
  disabled = false,
}: {
  label: string
  file: File | null
  onFileChange: (file: File | null) => void
  placeholder?: string
  disabled?: boolean
}) {
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
          border: `1.5px dashed ${file ? TOKENS.primary : TOKENS.borderHover}`,
          backgroundColor: file ? alpha(TOKENS.primary, 0.03) : '#fff',
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
        {file ? (
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
        <Typography sx={{ color: file ? TOKENS.ink : TOKENS.textMuted, fontWeight: file ? 600 : 500, fontSize: '0.92rem' }}>
          {file ? file.name : placeholder ?? `Incarca ${label.toLowerCase()}`}
        </Typography>
        <input
          type="file"
          hidden
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFileChange(f)
          }}
        />
      </Box>
    </Box>
  )
}
