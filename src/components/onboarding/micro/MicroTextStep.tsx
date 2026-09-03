import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { useAutosave } from '../../../hooks/useAutosave'
import { usePublishAutosave } from '../autosaveStore'
import type { FieldDef, MicroStepContext, MicroStepDef } from '../microStepTypes'
import { TOKENS, inputSx } from '../onboardingTheme'
import { useMicroSteps } from '../useMicroSteps'
import { passwordStrength } from './passwordStrength'

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

  /** Câmpurile atinse — o eroare nu se afișează pe un câmp în care nu s-a tastat încă nimic. */
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const fields = useMemo(() => def.fields ?? [], [def])

  /**
   * Precompletările: valoarea inițială se scrie o dată în răspunsuri, nu doar în input.
   * Altfel ecranele următoare (`oblio_conectare` citește emailul de aici) ar vedea un câmp gol
   * deși pe ecran scria ceva.
   */
  useEffect(() => {
    for (const field of fields) {
      if (!field.initialValue) continue
      if (answers[`${def.id}.${field.key}`] !== undefined) continue

      const initial = field.initialValue(context)
      if (initial !== '') answer(`${def.id}.${field.key}`, initial)
    }
    // Rulează la schimbarea ecranului sau când sosesc datele serverului; `answers` e citit
    // înăuntru ca gardă de idempotență, deci nu trebuie să retrigereze efectul.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.id, fields, context.state, context.resources])

  // `def` e stabil pe durata unui ecran; `def.fields ?? []` ar fi un array nou la fiecare render.
  const values = useMemo(() => {
    const result: Record<string, string> = {}
    for (const field of fields) {
      const stored = answers[`${def.id}.${field.key}`]
      result[field.key] = typeof stored === 'string' ? stored : ''
    }
    return result
  }, [answers, def, fields])

  const save = useAutosave<Record<string, string>>({
    save: async (payload) => def.persist?.(payload, context),
    storageKey: `onboarding.micro.${def.id}`,
  })

  usePublishAutosave(save)

  const set = (field: FieldDef, next: string) => {
    answer(`${def.id}.${field.key}`, next)
    if (def.persist) save.schedule({ ...values, [field.key]: next })
  }

  const resolve = (
    value: string | ((c: MicroStepContext) => string | undefined) | undefined,
  ): string | undefined => (typeof value === 'function' ? value(context) : value)

  return (
    <Stack spacing={2}>
      {fields.map((field) => {
        const value = values[field.key]
        const error = touched[field.key] ? (field.validate?.(value) ?? null) : null
        const isPassword = field.type === 'password'
        const show = revealed[field.key] === true

        // Câmp venit din fișa clientului: se vede, nu se scrie. Serverul îl re-hidratează la
        // salvare, deci blocarea de aici e comoditate, nu control de acces.
        const lockRule = field.lockedWhenPrefilled
        const lockedByRule =
          typeof lockRule === 'function' ? lockRule(context) : lockRule === true
        const locked = lockedByRule && value !== ''

        return (
          <Box key={field.key}>
            <TextField
              select={field.options !== undefined}
              type={field.options ? undefined : isPassword && show ? 'text' : (field.type ?? 'text')}
              label={field.optional ? `${field.label} (opțional)` : field.label}
              placeholder={resolve(field.placeholder)}
              helperText={error ?? resolve(field.helper)}
              error={error !== null}
              value={value}
              disabled={locked}
              onChange={(event) => set(field, event.target.value)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, [field.key]: true }))
                void save.flush()
              }}
              autoComplete={isPassword ? 'new-password' : undefined}
              sx={inputSx}
              fullWidth
              slotProps={
                locked
                  ? { input: { readOnly: true } }
                  : isPassword
                  ? {
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              aria-label={show ? 'Ascunde parola' : 'Arată parola'}
                              onClick={() =>
                                setRevealed((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                              }
                            >
                              {show ? (
                                <VisibilityOffRoundedIcon fontSize="small" />
                              ) : (
                                <VisibilityRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }
                  : undefined
              }
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                  {/*
                    O variantă indisponibilă rămâne în listă, gri, cu eticheta ei. Motivul e
                    scris sub ea, nu într-un tooltip: un `MenuItem` dezactivat are
                    `pointer-events: none`, deci hover-ul n-ar ajunge niciodată la el.
                  */}
                  <Stack spacing={0.25} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Box
                        component="span"
                        sx={{ color: option.disabled ? TOKENS.textSubtle : 'inherit' }}
                      >
                        {option.title}
                      </Box>
                      {option.badge && <Chip label={option.badge} size="small" />}
                    </Stack>
                    {option.disabled && option.disabledReason && (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: TOKENS.textMuted,
                          whiteSpace: 'normal',
                          maxWidth: 320,
                        }}
                      >
                        {option.disabledReason}
                      </Typography>
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            {field.strengthMeter && value !== '' && <StrengthMeter value={value} />}
          </Box>
        )
      })}
    </Stack>
  )
}

/** Cât de greu e de ghicit parola. Informativ — regula care blochează e `field.validate`. */
function StrengthMeter({ value }: { value: string }) {
  const { score, label, color } = passwordStrength(value)

  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={score}
        aria-label="Puterea parolei"
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: TOKENS.border,
          '& .MuiLinearProgress-bar': { backgroundColor: color },
        }}
      />
      <Typography sx={{ fontSize: '0.75rem', color: TOKENS.textMuted }}>{label}</Typography>
    </Stack>
  )
}
