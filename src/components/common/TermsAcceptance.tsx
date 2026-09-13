import { Checkbox, FormControlLabel, Link, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../../constants/tokens'

interface TermsAcceptanceProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /**
   * Adaugă și linkul către politica de confidențialitate, în formularea scurtă cerută de
   * ecranul de înregistrare. Apelanții existenți rămân pe textul lung, cu un singur link.
   */
  withPrivacy?: boolean
  /** `dark` pe ecranele de autentificare, care au fond închis. */
  tone?: 'light' | 'dark'
}

const TONES = {
  light: { text: TOKENS.textMuted, box: alpha(TOKENS.ink, 0.28), link: TOKENS.primaryStrong },
  dark: { text: 'rgba(238, 242, 247, 0.62)', box: 'rgba(238, 242, 247, 0.35)', link: TOKENS.primary },
}

export function TermsAcceptance({
  checked,
  onChange,
  disabled = false,
  withPrivacy = false,
  tone = 'light',
}: TermsAcceptanceProps) {
  const colors = TONES[tone]
  const linkSx = {
    color: colors.link,
    fontWeight: 700,
    textDecorationColor: alpha(colors.link, 0.35),
    '&:hover': { textDecorationColor: colors.link },
  }

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
            color: colors.box,
            p: 0.25,
            '&.Mui-checked': { color: TOKENS.primary },
          }}
        />
      }
      label={
        <Typography sx={{ color: colors.text, fontSize: '0.86rem', lineHeight: 1.55 }}>
          {withPrivacy ? (
            <>
              Sunt de acord cu{' '}
              <Link
                href="/termeni-si-conditii"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                sx={linkSx}
              >
                Termenii
              </Link>{' '}
              și{' '}
              <Link
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                sx={linkSx}
              >
                Politica de confidențialitate
              </Link>
              .
            </>
          ) : (
            <>
              Am citit si accept{' '}
              <Link
                href="/termeni-si-conditii"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                sx={linkSx}
              >
                Termenii si Conditiile RIDElance
              </Link>
              .
            </>
          )}
        </Typography>
      }
    />
  )
}
