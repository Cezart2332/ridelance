import { alpha } from '@mui/material/styles'
import type { OnboardingSectionStatus } from '../../services/onboarding.service'
import { TOKENS as GLOBAL } from '../../constants/tokens'

/**
 * Tokens-urile onboardingului. Se aliniază la sursa globală (`src/constants/tokens.ts`) și adaugă
 * doar ce e specific fluxului de înrolare.
 *
 * Regula de culoare: accentul de brand (`primary`) înseamnă exclusiv „aici trebuie să acționezi
 * acum" — pasul activ și CTA-ul principal. Stările au paletă proprie, semantică (`success`,
 * `pending`, `danger`), ca să nu concureze cu accentul. Dacă totul e colorat, nimic nu ghidează.
 */
export const TOKENS = {
  ink: GLOBAL.ink,
  primary: GLOBAL.primary,
  primaryStrong: GLOBAL.primaryStrong,
  paper: GLOBAL.paper,
  surface: '#F8F9FC',
  border: GLOBAL.border,
  borderHover: GLOBAL.borderHover,
  textMuted: 'rgba(26, 26, 46, 0.55)',
  textSubtle: GLOBAL.textSubtle,
  /** `button: 10` e singurul radius pe care specul îl cere și care nu există în scara globală. */
  radius: { ...GLOBAL.radius, button: 10 },
  shadow: GLOBAL.shadow,
  easing: GLOBAL.easing,
  duration: GLOBAL.duration,

  // Semantice — separate de accent.
  success: '#2e7d32',
  pending: '#b54708',
  pendingBase: '#ed6c02',
  danger: '#b71c1c',
  dangerBase: '#d32f2f',

  /**
   * Tintele accentului, echivalentul scării `primary.50/100/200` din spec. Sunt derivate din
   * accentul platformei, nu din albastrul din spec: onboardingul trebuie să arate RIDElance.
   * Translucide, ca să se așeze și peste `surface`, nu doar peste alb.
   */
  primarySoft: alpha(GLOBAL.primary, 0.1),
  primaryTint: alpha(GLOBAL.primary, 0.22),
  primaryEdge: alpha(GLOBAL.primary, 0.45),
}

/** Perechea display + body. Cifrele sunt tabulare peste tot unde se numără sau se măsoară. */
export const DISPLAY_FONT = '"Bricolage Grotesque Variable", "Geist Variable", -apple-system, sans-serif'

export const displaySx = {
  fontFamily: DISPLAY_FONT,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
} as const

export const tabularSx = { fontVariantNumeric: 'tabular-nums' } as const

/** Culorile unei stări de pas — folosite doar împreună cu un icon și un text de status. */
export function stateColors(state: 'neutral' | 'accent' | 'success' | 'pending' | 'danger') {
  switch (state) {
    case 'accent':
      return { fg: TOKENS.primaryStrong, bg: alpha(TOKENS.primary, 0.12), border: TOKENS.primary }
    case 'success':
      return { fg: TOKENS.success, bg: alpha(TOKENS.success, 0.1), border: alpha(TOKENS.success, 0.35) }
    case 'pending':
      return {
        fg: TOKENS.pending,
        bg: alpha(TOKENS.pendingBase, 0.12),
        border: alpha(TOKENS.pendingBase, 0.4),
      }
    case 'danger':
      return { fg: TOKENS.danger, bg: alpha(TOKENS.dangerBase, 0.1), border: alpha(TOKENS.dangerBase, 0.45) }
    default:
      return { fg: TOKENS.textMuted, bg: alpha(TOKENS.ink, 0.05), border: TOKENS.border }
  }
}

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fff',
    color: TOKENS.ink,
    borderRadius: TOKENS.radius.md,
    fontWeight: 500,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(TOKENS.ink, 0.18),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.primary,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: alpha(TOKENS.ink, 0.45),
    opacity: 1,
  },
}

export function sectionStatusLabel(status: OnboardingSectionStatus): string {
  switch (status) {
    case 'Locked':
      return 'Blocat'
    case 'InProgress':
      return 'În completare'
    case 'AwaitingValidation':
      return 'În validare'
    case 'Validated':
      return 'Validat'
    case 'Rejected':
      return 'Respins'
    default:
      return status
  }
}

export function sectionStatusChipSx(status: OnboardingSectionStatus) {
  switch (status) {
    case 'Validated':
      return {
        borderColor: alpha(TOKENS.success, 0.2),
        color: TOKENS.success,
        backgroundColor: alpha(TOKENS.success, 0.08),
      }
    case 'AwaitingValidation':
      return {
        borderColor: alpha(TOKENS.pendingBase, 0.2),
        color: TOKENS.pending,
        backgroundColor: alpha(TOKENS.pendingBase, 0.1),
      }
    case 'Rejected':
      return {
        borderColor: alpha(TOKENS.dangerBase, 0.2),
        color: TOKENS.danger,
        backgroundColor: alpha(TOKENS.dangerBase, 0.08),
      }
    case 'InProgress':
      return {
        borderColor: alpha(TOKENS.primary, 0.35),
        color: TOKENS.primaryStrong,
        backgroundColor: alpha(TOKENS.primary, 0.1),
      }
    default:
      return { borderColor: TOKENS.border, color: TOKENS.textMuted, backgroundColor: alpha(TOKENS.ink, 0.04) }
  }
}
