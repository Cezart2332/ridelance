import { useEffect, useMemo, useRef, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'

import { MAPBOX_AVAILABLE } from '../../../lib/mapbox'
import { searchAddress, type GeocodeResult } from '../../../lib/geocoding'
import { dashboardInputSx } from '../../dashboard/dashboardTheme'

/**
 * Căutarea unei adrese, cu sugestii de la Mapbox.
 *
 * Alegerea unei sugestii dă coordonatele: utilizatorul scrie o adresă, nu latitudine și
 * longitudine. Cifrele alea sunt o unealtă de programator, nu un câmp de formular.
 */
interface AddressSearchProps {
  label?: string
  /** Textul afișat când există deja o locație aleasă. */
  value: string
  onPick: (result: GeocodeResult) => void
  helperText?: string
}

export function AddressSearch({ label = 'Caută adresa', value, onPick, helperText }: AddressSearchProps) {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Sub trei litere nu se caută, iar lista se ascunde prin derivare, nu prin golirea stării:
  // un `setOptions([])` în efect ar fi o randare în plus la fiecare tastă.
  const query = input.trim()
  const tooShort = query.length < 3
  const visible = tooShort ? [] : options

  useEffect(() => {
    if (query.length < 3) {
      return
    }

    // Debounce: fiecare tastă ar fi o cerere, iar Mapbox le numără.
    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      searchAddress(query, controller.signal)
        .then(setOptions)
        .catch(() => {
          // Anularea e normală la fiecare tastă nouă; o eroare reală lasă lista goală.
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const placeholder = useMemo(
    () => (MAPBOX_AVAILABLE ? 'Strada, numărul, orașul' : 'Căutarea are nevoie de harta configurată'),
    [],
  )

  return (
    <Autocomplete
      freeSolo
      disabled={!MAPBOX_AVAILABLE}
      options={visible}
      filterOptions={(x) => x}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      onInputChange={(_, next) => setInput(next)}
      onChange={(_, picked) => {
        if (picked && typeof picked !== 'string') onPick(picked)
      }}
      loading={loading}
      loadingText="Se caută…"
      noOptionsText={tooShort ? 'Scrie cel puțin 3 litere' : 'Nicio adresă găsită'}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          sx={dashboardInputSx}
          helperText={value ? `Selectat: ${value}` : helperText}
        />
      )}
    />
  )
}
