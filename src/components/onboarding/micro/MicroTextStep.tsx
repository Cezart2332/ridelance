import { MenuItem, Stack, TextField } from '@mui/material'
import { useMemo } from 'react'

import { useAutosave } from '../../../hooks/useAutosave'
import { usePublishAutosave } from '../autosaveStore'
import type { FieldDef, MicroStepContext, MicroStepDef } from '../microStepTypes'
import { inputSx } from '../onboardingTheme'
import { useMicroSteps } from '../useMicroSteps'

/**
 * Un card cu 1–4 câmpuri înrudite.
 *
 * De ce nu un câmp pe ecran: emailul și parola aceluiași cont sunt o singură decizie, iar
 * separate ar face din completarea credențialelor Uber și Bolt opt ecrane de tastat la rând.
 * Peste patru câmpuri, ecranul face deja două lucruri și trebuie spart.
 *
 * Salvarea e automată — la tastare (debounce) și la ieșirea din câmp. „Continuă" doar forțează
 * flush-ul, deci un tab închis în mijlocul cardului nu pierde nimic.
 */
export function MicroTextStep({ def, context }: { def: MicroStepDef; context: MicroStepContext }) {
  const { answers, answer } = useMicroSteps()

  // `def` e stabil pe durata unui ecran; `def.fields ?? []` ar fi un array nou la fiecare render.
  const values = useMemo(() => {
    const result: Record<string, string> = {}
    for (const field of def.fields ?? []) {
      const stored = answers[`${def.id}.${field.key}`]
      result[field.key] = typeof stored === 'string' ? stored : ''
    }
    return result
  }, [answers, def])

  const save = useAutosave<Record<string, string>>({
    save: async (payload) => def.persist?.(payload, context),
    storageKey: `onboarding.micro.${def.id}`,
  })

  usePublishAutosave(save)

  const set = (field: FieldDef, next: string) => {
    answer(`${def.id}.${field.key}`, next)
    if (def.persist) save.schedule({ ...values, [field.key]: next })
  }

  return (
    <Stack spacing={2}>
      {(def.fields ?? []).map((field) => (
        <TextField
          key={field.key}
          select={field.options !== undefined}
          type={field.options ? undefined : (field.type ?? 'text')}
          label={field.optional ? `${field.label} (opțional)` : field.label}
          placeholder={field.placeholder}
          helperText={field.helper}
          value={values[field.key]}
          onChange={(event) => set(field, event.target.value)}
          onBlur={() => void save.flush()}
          autoComplete={field.type === 'password' ? 'new-password' : undefined}
          sx={inputSx}
          fullWidth
        >
          {field.options?.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.title}
            </MenuItem>
          ))}
        </TextField>
      ))}
    </Stack>
  )
}

