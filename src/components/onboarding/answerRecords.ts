import { MICRO_STEPS } from './config'
import type { MicroStepAnswer, MicroStepDef } from './microStepTypes'

/** Un răspuns gata de trimis: textul întrebării și al variantei, cum erau pe ecran. */
export interface AnswerRecord {
  stepKey: string
  questionId: string
  question: string
  value: string
  valueLabel: string
}

function findDef(id: string): MicroStepDef | undefined {
  for (const defs of Object.values(MICRO_STEPS)) {
    const def = defs.find((d) => d.id === id)
    if (def) return def
  }
  return undefined
}

/**
 * Răspunsul, descris pentru admin. `null` pentru ce nu se trimite: parolele (conturile Bolt/Uber)
 * și răspunsurile pe care nu le recunoaștem în config.
 *
 * Câmpurile unui ecran `text` au cheia `${def.id}.${field.key}`; alegerile și bifele, `def.id`.
 */
export function describeAnswer(id: string, value: MicroStepAnswer): AnswerRecord | null {
  const [defId, fieldKey] = id.split('.', 2)
  const def = findDef(defId)
  if (!def) return null

  if (fieldKey) {
    const field = def.fields?.find((f) => f.key === fieldKey)
    if (!field || field.type === 'password' || typeof value !== 'string') return null
    return {
      stepKey: def.macroStep,
      questionId: id,
      question: `${def.title} · ${field.label}`,
      value,
      valueLabel: field.options?.find((o) => o.value === value)?.title ?? value,
    }
  }

  const labelOf = (v: string) => def.choices?.find((c) => c.value === v)?.title ?? v
  if (Array.isArray(value)) {
    return {
      stepKey: def.macroStep,
      questionId: id,
      question: def.title,
      value: JSON.stringify(value),
      valueLabel: value.length > 0 ? value.map(labelOf).join(', ') : 'Nimic bifat',
    }
  }

  return { stepKey: def.macroStep, questionId: id, question: def.title, value, valueLabel: labelOf(value) }
}

/** Valoarea salvată, înapoi în forma din sesiune: bifele au plecat ca listă JSON. */
export function restoreAnswer(id: string, stored: string): MicroStepAnswer {
  const def = findDef(id.split('.', 2)[0])
  if (def?.kind === 'multi') {
    try {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string')
    } catch {
      // Nu era listă: rămâne valoarea brută.
    }
  }
  return stored
}
