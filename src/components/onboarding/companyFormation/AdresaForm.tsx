import { Box, MenuItem, TextField } from '@mui/material'

import { COUNTIES } from '../../../data/counties'
import type { Adresa } from '../../../services/companyFormation.service'
import { inputSx } from '../onboardingTheme'
import { PrefilledAdornment } from './PrefilledAdornment'

interface AdresaFormProps {
  value: Adresa
  onChange: (next: Adresa) => void
  /** Salvarea de draft: se face la ieșirea din câmp, nu la fiecare tastă. */
  onBlur: () => void
  /** Prefixul cheilor de precompletare (ex. `DOMICILIU`), ca să știm ce câmp vine din CI. */
  prefix: string
  prefilled: Set<string>
  disabled?: boolean
}

/**
 * Adresa din România, în forma cerută de actele de înființare. Același component pentru
 * domiciliul solicitantului, sediul social și domiciliul fiecărui proprietar.
 */
export function AdresaForm({ value, onChange, onBlur, prefix, prefilled, disabled }: AdresaFormProps) {
  const set = (field: keyof Adresa) => (next: string) =>
    onChange({ ...value, [field]: next === '' ? null : next })

  const isPrefilled = (field: string) => prefilled.has(`${prefix}_${field}`.toUpperCase())

  const field = (
    key: keyof Adresa,
    label: string,
    prefilledKey: string,
    autoComplete?: string,
  ) => (
    <TextField
      label={label}
      value={value[key] ?? ''}
      onChange={(e) => set(key)(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      autoComplete={autoComplete}
      sx={inputSx}
      fullWidth
      slotProps={{
        input: { endAdornment: isPrefilled(prefilledKey) ? <PrefilledAdornment /> : undefined },
      }}
    />
  )

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <TextField
          select
          label="Județ"
          value={COUNTIES.includes(value.judet as never) ? value.judet : ''}
          onChange={(e) => set('judet')(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete="address-level1"
          sx={inputSx}
          fullWidth
          slotProps={{
            input: { endAdornment: isPrefilled('JUDET') ? <PrefilledAdornment /> : undefined },
          }}
        >
          {COUNTIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        {field('localitate', 'Localitate', 'LOCALITATE', 'address-level2')}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 1.5 }}>
        {field('strada', 'Stradă', 'STRADA', 'address-line1')}
        {field('numar', 'Număr', 'NUMAR', 'address-line2')}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {field('bloc', 'Bloc', 'BLOC')}
        {field('scara', 'Scara', 'SCARA')}
        {field('etaj', 'Etaj', 'ETAJ')}
        {field('apartament', 'Apartament', 'APARTAMENT')}
      </Box>
    </Box>
  )
}
