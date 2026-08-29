import { Alert, Box, MenuItem, Stack, TextField, Typography } from '@mui/material'

import type { PersoanaFizica, TipActIdentitate } from '../../../services/companyFormation.service'
import { TOKENS, inputSx } from '../onboardingTheme'
import { AdresaForm } from './AdresaForm'
import { PrefilledNotice } from './PrefilledNotice'
import { cnpBirthDate, isValidCnp, normalizeCnp } from './cnp'
import { DateField } from '../../common/DateField'

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
  /**
   * OCR-ul a citit buletinul cu încredere sub prag (sau deloc). Atunci nu are voie să contrazică
   * utilizatorul: verificarea de consistență devine informativă, nu semnal de eroare.
   */
  identityReadUnreliable?: boolean
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
  identityReadUnreliable = false,
  disabled,
}: PersoanaFizicaFormProps) {
  const set = <K extends keyof PersoanaFizica>(field: K, next: PersoanaFizica[K]) =>
    onChange({ ...value, [field]: next })

  const text = (field: keyof PersoanaFizica, next: string) =>
    set(field, (next === '' ? null : next) as PersoanaFizica[typeof field])

  // Normalizat pe ambele părți, mereu: comparațiile de mai jos trebuie să compare numărul, nu
  // ambalajul lui (spații nedespărțitoare, zero-width din copy-paste, separatoare).
  const cnp = normalizeCnp(value.cnp)
  const cnpComplete = cnp.length === 13
  const cnpInvalid = cnpComplete && !isValidCnp(cnp)

  // CNP-ul codifică data nașterii și sexul. Dacă nu se potrivesc cu ce am citit din CI, cel mai
  // probabil o cifră e greșită — dar OCR-ul nu e arbitru: sub pragul de încredere, nu spunem
  // nimic. Vezi `IdentityConfidence` pe backend și §1 din specul de fix-uri.
  const derivedBirth = cnpComplete && !cnpInvalid ? cnpBirthDate(cnp) : null
  const birthMismatch =
    !identityReadUnreliable &&
    derivedBirth !== null &&
    knownBirthDate != null &&
    derivedBirth !== knownBirthDate.slice(0, 10)

  const requiresSerie = value.tipAct === 'CI' || value.tipAct === 'BI'

  return (
    <Stack spacing={2}>
      <PrefilledNotice show={prefilled.size > 0} />

      {/*
        Discrepanța stă pe zona datelor citite din buletin, nu pe câmpul CNP.
        CNP-ul e sursa de adevăr — e un cod cu cifră de control, pe când data din buletin trece
        printr-un OCR — deci el nu e „greșit" când cele două nu se potrivesc. Ancorat sub CNP,
        avertismentul spunea exact pe dos: că de reparat e numărul pe care tocmai l-ai tastat corect.
      */}
      {birthMismatch && (
        <Alert
          severity="warning"
          role="alert"
          aria-live="polite"
          sx={{ borderRadius: `${TOKENS.radius.md}px` }}
        >
          Data nașterii citită din buletin ({knownBirthDate?.slice(0, 10)}) nu se potrivește cu cea
          din CNP ({derivedBirth}). Am reținut-o pe cea din CNP. Dacă poza buletinului era neclară,
          o poți reîncărca.
        </Alert>
      )}
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
        />
      </Box>

      <Box>
        <TextField
          label="CNP"
          value={cnp}
          onChange={(e) => text('cnp', normalizeCnp(e.target.value).slice(0, 13))}
          onBlur={onBlur}
          disabled={disabled}
          error={cnpInvalid}
          helperText={cnpInvalid ? 'CNP invalid — verifică cifrele.' : undefined}
          sx={inputSx}
          fullWidth
          slotProps={{
            htmlInput: { inputMode: 'numeric', maxLength: 13 },
          }}
        />

        {/*
          Alertele stau imediat sub câmpul lor, nu în josul paginii: explicația trebuie citită
          fără să pierzi din ochi ce anume trebuie corectat. `role="alert"` + `aria-live` ca
          apariția lor să fie anunțată, nu doar desenată.
        */}
        {cnpInvalid && (
          <Alert
            severity="error"
            role="alert"
            aria-live="polite"
            sx={{ mt: 1, borderRadius: `${TOKENS.radius.md}px` }}
          >
            Cifra de control a CNP-ului nu iese. Verifică toate cele 13 cifre, în special ziua și
            luna nașterii — o singură cifră greșită invalidează numărul.
          </Alert>
        )}

        {identityReadUnreliable && !cnpInvalid && (
          <Alert
            severity="warning"
            role="alert"
            aria-live="polite"
            sx={{ mt: 1, borderRadius: `${TOKENS.radius.md}px` }}
          >
            Nu am putut citi clar CNP-ul din buletin. Verifică datele introduse manual — poți
            continua oricum, un coleg le confirmă înainte de depunere.
          </Alert>
        )}

      </Box>

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
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <DateField
          label="Data emiterii"
          value={value.dataEmiterii ?? ''}
          onChange={(next) => text('dataEmiterii', next)}
          onBlur={onBlur}
          disabled={disabled}
          sx={inputSx}
          fullWidth
        />
        <DateField
          label="Data expirării"
          value={value.dataExpirarii ?? ''}
          onChange={(next) => text('dataExpirarii', next)}
          onBlur={onBlur}
          disabled={disabled}
          sx={inputSx}
          fullWidth
        />
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 700, color: TOKENS.ink, mb: 1 }}>Domiciliu</Typography>
        <AdresaForm
          value={value.domiciliu}
          onChange={(next) => set('domiciliu', next)}
          onBlur={onBlur}
          disabled={disabled}
        />
      </Box>
    </Stack>
  )
}
