import { useReducedMotion } from 'motion/react'

/**
 * Duratele de animație ale onboardingului, într-un singur loc.
 * Peste 600ms orice tranziție începe să pară lentă la a treia utilizare.
 */
export const DURATION = {
  /** Hover, press, apariția unui chip. */
  micro: 0.15,
  /** Colaps/expandare de pas, cross-fade între panouri. */
  step: 0.3,
  /** Checkmark-ul de validare — singurul moment de satisfacție per pas. */
  check: 0.4,
  /** Plafonul absolut. */
  max: 0.6,
} as const

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/**
 * Duratele efective, cu `prefers-reduced-motion` respectat: totul devine 0, dar stările finale
 * rămân identice — nu dispare niciun conținut, doar mișcarea.
 */
export function useMotionTokens() {
  const reduced = useReducedMotion() ?? false

  const duration = (value: number) => (reduced ? 0 : value)

  return {
    reduced,
    duration,
    /** Tranziția standard între pași. */
    step: { duration: duration(DURATION.step), ease: EASE_OUT },
    micro: { duration: duration(DURATION.micro), ease: EASE_OUT },
    check: { duration: duration(DURATION.check), ease: EASE_OUT },
    /** Pulse-ul de „în verificare” — oprit complet la reduced motion. */
    pulse: reduced ? undefined : { duration: 2, ease: 'easeInOut' as const, repeat: Infinity },
  }
}
