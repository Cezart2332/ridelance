import { Alert, Box, MenuItem, Stack, TextField, Typography } from '@mui/material'

import type { PersoanaFizica, TipActIdentitate } from '../../../services/companyFormation.service'
import { TOKENS, inputSx } from '../onboardingTheme'
import { AdresaForm } from './AdresaForm'
import { PrefilledAdornment } from './PrefilledAdornment'
import { cnpBirthDate, cnpSex, isValidCnp } from './cnp'

const TIP_ACT_LABELS: Record<TipActIdentitate, string> = {
  CI: 'Carte de identitate',
  CIE: 'Carte de identitate electronică',
  BI: 'Buletin de identitate',
  PasaportStrain: 'Pașaport străin',
  PermisSedere: 'Permis de ședere',
}

interface PersoanaFizicaFormProps {
  value: PersoanaFizica
  onChange: (next: PersoanaFizica) => void
  /** Salvarea de draft — la ieșirea din câmp, nu la fiecare tastă. */
  onBlur: () => void
  /** Cheile venite din OCR și neatinse de user. Gol pentru proprietari: ei nu au CI încărcată. */
  prefilled?: Set<string>
  /** Data nașterii citită din CI la Eligibilitate, pentru verificarea de consistență cu CNP-ul. */
  knownBirthDate?: string | null
  disabled?: boolean
}

/**
 * Datele de identitate ale unei persoane fizice. Același component pentru solicitant și pentru
 * proprietarii imobilului declarat ca sediu — actele cer exact aceleași câmpuri de la amândoi.
 */
export function PersoanaFizicaForm({
  value,
  onChange,
  onBlur,
  prefilled = new Set(),
  knownBirthDate,
  disabled,
}: PersoanaFizicaFormProps) {
  const set = <K extends keyof PersoanaFizica>(field: K, next: PersoanaFizica[K]) =>
    onChange({ ...value, [field]: next })

  const text = (field: keyof PersoanaFizica, next: string) =>
    set(field, (next === '' ? null : next) as PersoanaFizica[typeof field])

  const isPrefilled = (key: string) => prefilled.has(key)

  const cnp = value.cnp ?? ''
  const cnpComplete = cnp.length === 13
  const cnpInvalid = cnpComplete && !isValidCnp(cnp)

  // Verificare soft: CNP-ul codifică data nașterii și sexul. Dacă nu se potrivesc cu ce am
  // citit din CI, cel mai probabil o cifră e greșită — dar nu blocăm, doar semnalăm.
  const derivedBirth = cnpComplete ? cnpBirthDate(cnp) : null
  const birthMismatch =
    derivedBirth !== null &&
    knownBirthDate != null &&
    derivedBirth !== knownBirthDate.slice(0, 10)

  const requiresSerie = value.tipAct === 'CI' || value.tipAct === 'BI'

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <TextField
          label="Nume"
          value={value.nume ?? ''}
          onChange={(e) => text('nume', e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete="family-name"
          sx={inputSx}
          fullWidth
          slotProps={{ input: { endAdornment: isPrefilled('NUME') ? <PrefilledAdornment /> : undefined } }}
        />
        <TextField
          label="Prenume"
          value={value.prenume ?? ''}
          onChange={(e) => text('prenume', e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete="given-name"
          sx={inputSx}
          fullWidth
          slotProps={{ input: { endAdornment: isPrefilled('PRENUME') ? <PrefilledAdornment /> : undefined } }}
        />
      </Box>

      <TextField
        label="CNP"
        value={cnp}
        onChange={(e) => text('cnp', e.target.value.replace(/\D/g, '').slice(0, 13))}
        onBlur={onBlur}
        disabled={disabled}
        error={cnpInvalid}
        helperText={cnpInvalid ? 'CNP invalid — verifică cifrele.' : undefined}
        sx={inputSx}
        fullWidth
        slotProps={{
          htmlInput: { inputMode: 'numeric', maxLength: 13 },
          input: { endAdornment: isPrefilled('CNP') ? <PrefilledAdornment /> : undefined },
        }}
      />

      {birthMismatch && (
        <Alert severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          Verifică CNP-ul: data nașterii din el ({derivedBirth}) nu se potrivește cu cea din
          cartea de identitate{cnpSex(cnp) ? ` (sex ${cnpSex(cnp)})` : ''}.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 1.5 }}>
        <TextField
          select
          label="Tip act"
          value={value.tipAct}
          onChange={(e) => set('tipAct', e.target.value as TipActIdentitate)}
          onBlur={onBlur}
          disabled={disabled}
          sx={inputSx}
          fullWidth
        >
          {(Object.keys(TIP_ACT_LABELS) as TipActIdentitate[]).map((t) => (
            <MenuItem key={t} value={t}>
              {TIP_ACT_LABELS[t]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={requiresSerie ? 'Serie' : 'Serie (opțional)'}
          value={value.serieAct ?? ''}
          onChange={(e) => text('serieAct', e.target.value.toUpperCase().slice(0, 8))}
          onBlur={onBlur}
          disabled={disabled}
          sx={inputSx}
          fullWidth
          slotProps={{
            input: { endAdornment: isPrefilled('SERIE_ACT') ? <PrefilledAdornment /> : undefined },
          }}
        />
        <TextField
          label="Număr"
          value={value.numarAct ?? ''}
          onChange={(e) => text('numarAct', e.target.value.slice(0, 16))}
          onBlur={onBlur}
          disabled={disabled}
          sx={inputSx}
          fullWidth
          slotProps={{
            input: { endAdornment: isPrefilled('NUMAR_ACT') ? <PrefilledAdornment /> : undefined },
          }}
        />
      </Box>

      <TextField
        label="Autoritate emitentă"
        value={value.autoritateEmitenta ?? ''}
        onChange={(e) => text('autoritateEmitenta', e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        sx={inputSx}
        fullWidth
        slotProps={{
          input: {
            endAdornment: isPrefilled('AUTORITATE_EMITENTA') ? <PrefilledAdornment /> : undefined,
          },
        }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <TextField
          type="date"
          label="Data emiterii"
          value={value.dataEmiterii ?? ''}
          onChange={(e) => text('dataEmiterii', e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          sx={inputSx}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          type="date"
          label="Data expirării"
          value={value.dataExpirarii ?? ''}
          onChange={(e) => text('dataExpirarii', e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          sx={inputSx}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 700, color: TOKENS.ink, mb: 1 }}>Domiciliu</Typography>
        <AdresaForm
          value={value.domiciliu}
          onChange={(next) => set('domiciliu', next)}
          onBlur={onBlur}
          prefix="DOMICILIU"
          prefilled={prefilled}
          disabled={disabled}
        />
      </Box>
    </Stack>
  )
}
