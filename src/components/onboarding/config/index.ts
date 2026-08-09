import type { MicroStepDef } from '../microStepTypes'
import { eligibilityMicroSteps } from './eligibility'

/**
 * Catalogul micro-pașilor, pe pași mari.
 *
 * Migrarea e progresivă (spec §11): un pas mare fără intrare aici rulează exact ca înainte, pe
 * pagina lui. Adăugarea unui pas nou înseamnă un fișier de config aici, nu componente noi.
 */
export const MICRO_STEPS: Record<string, MicroStepDef[]> = {
  eligibility: eligibilityMicroSteps,
}

export const microStepsOf = (macroKey: string | null): MicroStepDef[] =>
  (macroKey ? MICRO_STEPS[macroKey] : undefined) ?? []

/**
 * Câte ecrane numără un pas mare pentru contorul din topbar. Pașii nemigrați contează ca unul
 * singur — aproximație asumată până când primesc și ei config (spec §11).
 */
export const screenCountOf = (macroKey: string): number => MICRO_STEPS[macroKey]?.length ?? 1

export { eligibilityMicroSteps }
