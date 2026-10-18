import { Box, MenuItem, TextField } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import { COUNTIES, canonicalCounty } from '../../../data/counties'
import { companyFormationService, type Adresa } from '../../../services/companyFormation.service'
import { inputSx } from '../onboardingTheme'

interface AdresaFormProps {
  value: Adresa
  onChange: (next: Adresa) => void
  /** Salvarea de draft: se face la ieșirea din câmp, nu la fiecare tastă. */
  onBlur: () => void
  disabled?: boolean
}

/** Codul poștal românesc: exact șase cifre. */
const POSTAL_CODE_LENGTH = 6

/** Cât se așteaptă după ultima tastă din localitate înainte de căutarea codului poștal. */
const LOOKUP_DELAY_MS = 600

/**
 * Adresa din România, în forma cerută de actele de înființare. Același component pentru
 * domiciliul solicitantului, sediul social și domiciliul fiecărui proprietar.
 *
 * Codul poștal e obligatoriu și se completează singur din județ și localitate (localitati.dev).
 * La orașele mari codul e pe stradă, iar cel găsit e al localității, deci câmpul rămâne editabil.
 */
export function AdresaForm({ value, onChange, onBlur, disabled }: AdresaFormProps) {
  const set = (field: keyof Adresa) => (next: string) =>
    onChange({ ...value, [field]: next === '' ? null : next })

  const county = canonicalCounty(value.judet)

  /** Codul pus de noi: cât omul nu l-a schimbat, o localitate nouă îl înlocuiește. */
  const [autoCode, setAutoCode] = useState<string | null>(null)
  /** Ultima pereche județ–localitate căutată, ca aceeași să nu plece de două ori. */
  const lookedUp = useRef<string | null>(null)
  /** Valoarea completată de noi așteaptă salvarea, după ce părintele o primește înapoi. */
  const saveAfter = useRef<Adresa | null>(null)

  // Valoarea și handlerul proaspete, fără ca fiecare randare a părintelui să repornească căutarea.
  const latest = useRef({ value, onChange })
  useEffect(() => {
    latest.current = { value, onChange }
  })

  /** Completează adresa și cere salvarea ei. */
  const fill = (patch: Partial<Adresa>) => {
    const next = { ...latest.current.value, ...patch }
    saveAfter.current = next
    latest.current.onChange(next)
  }

  // Ce citește OCR-ul de pe buletin („CJ", „Jud. BV") se aduce la numele din listă, altfel
  // selectul ar rămâne gol deși județul era acolo.
  useEffect(() => {
    if (disabled || !value.judet || !county || county === value.judet) return
    fill({ judet: county })
  }, [disabled, value.judet, county])

  const locality = value.localitate?.trim() ?? ''
  const replaceable = !value.codPostal || value.codPostal === autoCode

  useEffect(() => {
    if (disabled || !county || !locality || !replaceable) return
    const key = `${county}|${locality.toLowerCase()}`
    if (lookedUp.current === key) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      lookedUp.current = key
      companyFormationService
        .lookupPostalCode(county, locality)
        .then((code) => {
          if (cancelled || !code || code === latest.current.value.codPostal) return
          setAutoCode(code)
          fill({ judet: county, codPostal: code })
        })
        // Negăsit sau serviciul indisponibil: câmpul rămâne de completat de mână.
        .catch(() => undefined)
    }, LOOKUP_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [disabled, county, locality, replaceable])

  // Salvăm abia când valoarea completată s-a întors de la părinte: `onBlur` de dinainte ar fi
  // salvat adresa veche.
  useEffect(() => {
    const pending = saveAfter.current
    if (!pending || value.codPostal !== pending.codPostal || value.judet !== pending.judet) return
    saveAfter.current = null
    onBlur()
  }, [value.codPostal, value.judet, onBlur])

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

  const postalCode = value.codPostal ?? ''
  // Cât timp se tastează, un cod incomplet e normal. Se semnalează doar ce e clar greșit.
  const postalCodeInvalid =
    postalCode.length > 0 && postalCode.length < POSTAL_CODE_LENGTH && !disabled

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <TextField
          select
          label="Județ"
          value={county ?? ''}
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <TextField
          label="Cod poștal"
          value={postalCode}
          onChange={(e) => set('codPostal')(e.target.value.replace(/\D/g, '').slice(0, POSTAL_CODE_LENGTH))}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete="postal-code"
          error={postalCodeInvalid}
          helperText={postalCodeInvalid ? 'Codul poștal are exact șase cifre.' : undefined}
          sx={inputSx}
          fullWidth
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: POSTAL_CODE_LENGTH } }}
        />
      </Box>
    </Box>
  )
}
