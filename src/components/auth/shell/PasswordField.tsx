import { useState } from 'react'
import { Box, IconButton, InputAdornment, LinearProgress, TextField, Typography } from '@mui/material'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import { AUTH_COLORS, authInputSx } from './authShellSx'
import { passwordStrength, type StrengthTone } from '../authValidation'
import { TOKENS } from '../../../constants/tokens'

// Fără hex-uri noi: culorile semantice vin din paleta MUI, singurul loc unde proiectul le are.
const TONE_COLOR: Record<StrengthTone, 'error' | 'warning' | 'success'> = {
  weak: 'error',
  medium: 'warning',
  strong: 'success',
}

interface PasswordFieldProps {
  /** Numele accesibil al câmpului. Designul nu are etichete vizibile, doar placeholder. */
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string | null
  disabled?: boolean
  /** `current-password` la login, `new-password` la înregistrare. */
  autoComplete: 'current-password' | 'new-password'
  /** Indicatorul de putere ocupă slotul de `helperText`. */
  showStrength?: boolean
}

export function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  autoComplete,
  showStrength = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const strength = passwordStrength(value)

  return (
    <TextField
      fullWidth
      hiddenLabel
      placeholder={placeholder}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      autoComplete={autoComplete}
      error={Boolean(error)}
      sx={authInputSx}
      slotProps={{
        htmlInput: { 'aria-label': label, 'aria-required': true },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                // Sărit din ordinea de tab: e o comoditate, nu un pas al formularului.
                tabIndex={-1}
                edge="end"
                disabled={disabled}
                aria-label={visible ? 'Ascunde parola' : 'Arată parola'}
                onClick={() => setVisible((current) => !current)}
              >
                {visible ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
        // `helperText` randează un `<p>`, iar bara de putere e un `<div>` — fără asta ar ieși
        // HTML invalid.
        formHelperText: { component: 'div' },
      }}
      helperText={
        error ? (
          error
        ) : showStrength && value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={strength.score * 25}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: `${TOKENS.radius.xs}px`,
                backgroundColor: AUTH_COLORS.border,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: (t) => t.palette[TONE_COLOR[strength.tone]].main,
                },
              }}
            />
            <Typography variant="caption" sx={{ color: AUTH_COLORS.textMuted }}>
              {strength.label}
            </Typography>
          </Box>
        ) : null
      }
    />
  )
}
