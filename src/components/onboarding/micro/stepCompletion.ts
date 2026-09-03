import type { MicroStepAnswers, MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Când e „Continuă" activ, pe tipurile de ecran care nu au un răspuns unic — și, mai important,
 * DE CE nu e.
 *
 * Regula, aplicată global pe onboarding (spec fix-uri §10.4): un buton dezactivat fără explicație
 * e inacceptabil. Utilizatorul care se blochează la pasul 05 n-are cum să ghicească dacă lipsește
 * parola Bolt sau telefonul Uber.
 *
 * Stau într-un fișier fără componente ca să nu rupă fast refresh — un modul care exportă și
 * componente, și funcții, își pierde reîncărcarea la cald.
 */

/** Câmpurile obligatorii ale unui ecran `text` sunt completate și valide. */
export function textStepComplete(
  def: MicroStepDef,
  answers: MicroStepAnswers,
  context?: MicroStepContext,
): boolean {
  return textStepIssues(def, answers, context).length === 0
}

/**
 * Ce mai lipsește dintr-un ecran `text`, în cuvinte: `Parola contului: minim 8 caractere`.
 * Câmpurile opționale contează doar dacă au fost completate greșit.
 *
 * `context` e opțional, dar când e dat schimbă tratamentul câmpurilor GOALE: dacă serverul zice
 * deja că ecranul e rezolvat (`isDone`), un câmp gol nu mai e o lipsă. Contează pentru valorile pe
 * care serverul nu le trimite înapoi — parola contului de flotă, de pildă, n-are `initialValue`
 * fiindcă răspunsul poartă doar `hasPassword`. După un refresh, câmpul revenea gol și „Continuă"
 * rămânea blocat pe un ecran deja salvat. Un câmp completat GREȘIT rămâne o problemă oricum.
 */
export function textStepIssues(
  def: MicroStepDef,
  answers: MicroStepAnswers,
  context?: MicroStepContext,
): string[] {
  const issues: string[] = []
  const savedOnServer = context !== undefined && def.isDone(context)

  for (const field of def.fields ?? []) {
    const stored = answers[`${def.id}.${field.key}`]
    const value = typeof stored === 'string' ? stored : ''
    const filled = value.trim() !== ''

    if (!filled) {
      if (!field.optional && !savedOnServer) issues.push(`Completează: ${field.label}`)
      continue
    }

    const error = field.validate?.(value)
    if (error) issues.push(`${field.label}: ${error}`)
  }

  return issues
}

/** S-au bifat destule variante pe un ecran `multi`. */
export function multiStepComplete(def: MicroStepDef, value: unknown): boolean {
  const selected = Array.isArray(value) ? value : []
  return selected.length >= (def.minSelected ?? 1)
}

/** De ce nu se poate continua de pe un ecran `multi`. */
export function multiStepIssues(def: MicroStepDef, value: unknown): string[] {
  if (multiStepComplete(def, value)) return []

  const needed = def.minSelected ?? 1
  const selected = Array.isArray(value) ? value.length : 0

  return needed === 1
    ? ['Alege cel puțin o variantă.']
    : [`Alege ${needed} variante — ai bifat ${selected}.`]
}
