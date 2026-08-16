import { useState } from 'react'
import { Box, IconButton, InputAdornment, LinearProgress, TextField, Typography } from '@mui/material'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import { authInputSx } from './authShellSx'
import { passwordStrength, type StrengthTone } from '../authValidation'
import { TOKENS } from '../../../constants/tokens'

// Fără hex-uri noi: culorile semantice vin din paleta MUI, singurul loc unde proiectul le are.
const TONE_COLOR: Record<StrengthTone, 'error' | 'warning' | 'success'> = {
  weak: 'error',
  medium: 'warning',
  strong: 'success',
}

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string | null
  disabled?: boolean
  /** `current-password` la login, `new-password` la înregistrare. */
  autoComplete: 'current-password' | 'new-password'
  /** Indicatorul de putere ocupă slotul de `helperText`, deci nu adaugă înălțime. */
  showStrength?: boolean
}

export function PasswordField({
  label,
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
      required
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      autoComplete={autoComplete}
      error={Boolean(error)}
      sx={authInputSx}
      slotProps={{
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
                {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
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
        ) : showStrength ? (
          // Slotul rămâne rezervat și când câmpul e gol — altfel apariția barei ar împinge
          // formularul în jos exact când utilizatorul începe să tasteze.
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 0.5,
              opacity: value ? 1 : 0,
              transition: 'opacity 200ms',
            }}
          >
            <LinearProgress
              variant="determinate"
              value={strength.score * 25}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: `${TOKENS.radius.xs}px`,
                backgroundColor: TOKENS.border,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: (t) => t.palette[TONE_COLOR[strength.tone]].main,
                },
              }}
            />
            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
              {strength.label}
            </Typography>
          </Box>
        ) : null
      }
    />
  )
}
