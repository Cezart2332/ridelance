import type { MicroStepAnswers, MicroStepDef } from '../microStepTypes'

/**
 * Când e „Continuă" activ, pe tipurile de ecran care nu au un răspuns unic.
 *
 * Stau într-un fișier fără componente ca să nu rupă fast refresh — un modul care exportă și
 * componente, și funcții, își pierde reîncărcarea la cald.
 */

/** Câmpurile obligatorii ale unui ecran `text` sunt completate. */
export function textStepComplete(def: MicroStepDef, answers: MicroStepAnswers): boolean {
  return (def.fields ?? [])
    .filter((field) => !field.optional)
    .every((field) => {
      const value = answers[`${def.id}.${field.key}`]
      return typeof value === 'string' && value.trim() !== ''
    })
}

/** S-au bifat destule variante pe un ecran `multi`. */
export function multiStepComplete(def: MicroStepDef, value: unknown): boolean {
  const selected = Array.isArray(value) ? value : []
  return selected.length >= (def.minSelected ?? 1)
}
