import { Checkbox, FormControlLabel, Link, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../../constants/tokens'

interface PaymentPolicyAcceptanceProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function PaymentPolicyAcceptance({
  checked,
  onChange,
  disabled = false,
}: PaymentPolicyAcceptanceProps) {
  return (
    <FormControlLabel
      sx={{
        alignItems: 'flex-start',
        m: 0,
        gap: 1,
        '& .MuiFormControlLabel-label': {
          pt: 0.35,
        },
      }}
      control={
        <Checkbox
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          sx={{
            color: alpha(TOKENS.ink, 0.28),
            p: 0.25,
            '&.Mui-checked': { color: TOKENS.primary },
          }}
        />
      }
      label={
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.86rem', lineHeight: 1.55 }}>
          Am citit si accept{' '}
          <Link
            href="/politica-plati-abonamente"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            sx={{
              color: TOKENS.primaryStrong,
              fontWeight: 800,
              textDecorationColor: alpha(TOKENS.primaryStrong, 0.35),
              '&:hover': { textDecorationColor: TOKENS.primaryStrong },
            }}
          >
            Politica de Plati, Abonamente si Rambursari RIDElance
          </Link>
          .
        </Typography>
      }
    />
  )
}
