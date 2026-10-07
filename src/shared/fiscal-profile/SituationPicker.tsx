import { Checkbox, FormControlLabel, Stack } from '@mui/material'

import type { FiscalProfileKey } from '../../services/fiscalProfile.service'
import { SITUATIONS } from './schema'

interface Props {
  /** Situațiile bifate; `[]` cu `none` = „Niciuna”. */
  selected: FiscalProfileKey[]
  none: boolean
  onChange: (selected: FiscalProfileKey[], none: boolean) => void
  disabled?: boolean
}

/**
 * Bifele situației fiscale. Se pot combina (pensionar și angajat), iar „Niciuna” le golește pe
 * celelalte — și invers: o bifă scoate „Niciuna”.
 */
export function SituationPicker({ selected, none, onChange, disabled }: Props) {
  const toggle = (key: FiscalProfileKey, checked: boolean) =>
    onChange(checked ? [...selected, key] : selected.filter((k) => k !== key), false)

  return (
    <Stack spacing={0.5} role="group" aria-label="Situația fiscală">
      {SITUATIONS.map((situation) => (
        <FormControlLabel
          key={situation.key}
          control={
            <Checkbox
              checked={selected.includes(situation.key)}
              onChange={(event) => toggle(situation.key, event.target.checked)}
              disabled={disabled}
            />
          }
          label={situation.label}
        />
      ))}
      <FormControlLabel
        control={<Checkbox checked={none} onChange={(event) => onChange([], event.target.checked)} disabled={disabled} />}
        label="Niciuna"
      />
    </Stack>
  )
}
