import { Box, MenuItem, TextField } from '@mui/material'

import { COUNTIES } from '../../../data/counties'
import type { Adresa } from '../../../services/companyFormation.service'
import { inputSx } from '../onboardingTheme'

interface AdresaFormProps {
  value: Adresa
  onChange: (next: Adresa) => void
  /** Salvarea de draft: se face la ieșirea din câmp, nu la fiecare tastă. */
  onBlur: () => void
  disabled?: boolean
}

/**
 * Adresa din România, în forma cerută de actele de înființare. Același component pentru
 * domiciliul solicitantului, sediul social și domiciliul fiecărui proprietar.
 */
export function AdresaForm({ value, onChange, onBlur, disabled }: AdresaFormProps) {
  const set = (field: keyof Adresa) => (next: string) =>
    onChange({ ...value, [field]: next === '' ? null : next })

  const field = (
    key: keyof Adresa,
    label: string,
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
        >
          {COUNTIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        {field('localitate', 'Localitate', 'address-level2')}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 1.5 }}>
        {field('strada', 'Stradă', 'address-line1')}
        {field('numar', 'Număr', 'address-line2')}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {field('bloc', 'Bloc')}
        {field('scara', 'Scara')}
        {field('etaj', 'Etaj')}
        {field('apartament', 'Apartament')}
      </Box>
    </Box>
  )
}
