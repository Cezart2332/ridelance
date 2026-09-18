import type { SxProps, Theme } from '@mui/material/styles'
import { TOKENS } from '../../../constants/tokens'

/**
 * Culorile ecranelor de autentificare: alb și albastrul platformei.
 *
 * Fondul paginii e o tentă de albastru foarte deschisă, ca albul cardului să se desprindă de el.
 */
export const AUTH_COLORS = {
  page: '#EAF6FC',
  card: TOKENS.paper,
  input: TOKENS.surface,
  inputHover: TOKENS.surfaceAlt,
  border: 'rgba(26, 26, 46, 0.09)',
  borderStrong: 'rgba(26, 26, 46, 0.18)',
  text: TOKENS.ink,
  textMuted: TOKENS.textMuted,
  textSubtle: TOKENS.textSubtle,
  primary: TOKENS.primary,
  primaryStrong: TOKENS.primaryStrong,
  /** Text pe butonul albastru, ca pe restul site-ului. */
  onPrimary: '#FFFFFF',
} as const

/**
 * Câmpurile din design: umplute, fără contur vizibil și fără etichetă flotantă — doar placeholder.
 * Numele accesibil vine din `aria-label`, pus de fiecare câmp.
 *
 * 16px pe input e obligatoriu: sub atât, Safari pe iOS face zoom la focus.
 */
export const authInputSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: `${TOKENS.radius.md}px`,
    backgroundColor: AUTH_COLORS.input,
    color: AUTH_COLORS.text,
    transition: `background-color ${TOKENS.duration} ${TOKENS.easing}`,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: AUTH_COLORS.border },
    '&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
      borderColor: AUTH_COLORS.borderStrong,
    },
    '&:hover': { backgroundColor: AUTH_COLORS.inputHover },
    '&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
      borderColor: AUTH_COLORS.primary,
      borderWidth: 1,
    },
  },
  '& .MuiOutlinedInput-input': {
    py: 'var(--auth-input-padding, 12px)',
    fontSize: '1rem',
  },
  '& .MuiInputBase-input::placeholder': {
    color: AUTH_COLORS.textSubtle,
    opacity: 1,
  },
  '& .MuiInputAdornment-root .MuiIconButton-root': { color: AUTH_COLORS.textSubtle },
  '& .MuiFormHelperText-root': { mx: 0.25 },
}

/** Butonul principal: plin, albastru, pe toată lățimea. */
export const authPrimaryButtonSx = {
  minHeight: 'var(--auth-button-height, 48px)',
  borderRadius: `${TOKENS.radius.md}px`,
  backgroundColor: AUTH_COLORS.primary,
  color: AUTH_COLORS.onPrimary,
  fontWeight: 750,
  fontSize: '0.98rem',
  boxShadow: '0 8px 20px rgba(69, 184, 226, 0.25)',
  '&:hover': { backgroundColor: AUTH_COLORS.primaryStrong, boxShadow: '0 8px 20px rgba(69, 184, 226, 0.3)' },
  '&.Mui-disabled': { backgroundColor: 'rgba(92, 203, 245, 0.45)', color: AUTH_COLORS.onPrimary },
} satisfies SxProps<Theme>

/** Spațierea formularului, într-un singur loc. */
export const AUTH_DENSITY = {
  headerToFields: { mb: 'var(--auth-header-gap, 28px)' },
  betweenFields: { gap: 'var(--auth-field-gap, 14px)' },
  fieldsToMeta: { mt: 'var(--auth-meta-gap, 16px)' },
  metaToCta: { mt: 'var(--auth-action-gap, 24px)' },
  ctaToFooter: { mt: 'var(--auth-footer-gap, 24px)' },
} satisfies Record<string, SxProps<Theme>>

/** Lățimea conținutului formularului, în jumătatea dreaptă a cardului. */
export const AUTH_FORM_CONTENT = 440
