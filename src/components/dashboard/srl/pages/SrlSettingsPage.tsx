import { useEffect, useState } from 'react'
import { Alert, Box, Button, Checkbox, FormControlLabel, Link as MuiLink, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { SRL_PATHS } from '../../../../config/srlNavigation'
import { rentalsService, type RentalDefaults } from '../../../../services/rentals.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { PageHeader, Panel } from '../../ui'

/**
 * Setările SRL — **doar preferințe operaționale** (spec §3.1).
 *
 * Datele de identitate ale firmei nu mai sunt aici: CUI-ul editabil din două locuri e un mod
 * garantat de a ajunge cu două CUI-uri diferite pe două documente. Au plecat în Profil, iar
 * pagina asta păstrează doar un link către ele.
 *
 * Valorile de aici se **copiază** în fiecare închiriere nouă, nu se citesc la afișare. Ridicarea
 * tarifului standard nu rescrie contractele deja făcute, iar corectarea unei sume într-un contract
 * nu se întoarce aici.
 */

const FUEL_RULES = ['Cel puțin nivelul de la preluare', 'Plin → plin']

/** Perioada minimă, în zile. Textul liber de dinainte nu se putea compara cu nimic. */
const MIN_PERIODS: { value: number | null; label: string }[] = [
  { value: null, label: 'Fără perioadă minimă' },
  { value: 7, label: '1 săptămână' },
  { value: 30, label: '1 lună' },
  { value: 60, label: '2 luni' },
]

/** Lei din bani, ca text de input. Câmpul gol înseamnă „nesetat", nu zero. */
const lei = (bani: number | null): string => (bani == null ? '' : String(bani / 100))
const bani = (value: string): number | null => (value.trim() === '' ? null : Math.round(Number(value) * 100))

export function SrlSettingsPage() {
  const [defaults, setDefaults] = useState<RentalDefaults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false

    rentalsService
      .getDefaults()
      .then((data) => {
        if (!cancelled) setDefaults(data)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca setările.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={340} />
      </Stack>
    )
  }

  if (error || !defaults) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error ?? 'Nu am putut încărca setările.'}
        </Alert>
      </Box>
    )
  }

  const settings = defaults

  const update = <K extends keyof RentalDefaults>(key: K, value: RentalDefaults[K]) => {
    setDefaults({ ...settings, [key]: value })
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      // Se reia din răspuns: serverul golește limita de km când bifa e stinsă, iar formularul
      // trebuie să arate ce s-a salvat, nu ce s-a trimis.
      setDefaults(await rentalsService.saveDefaults(settings))
      setSaved(true)
    } catch {
      setError('Nu am putut salva setările.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Setări"
        subtitle="Valorile cu care pornește fiecare închiriere nouă."
        actions={
          <Button
            variant="contained"
            disableElevation
            onClick={save}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            {saving ? 'Se salvează…' : 'Salvează'}
          </Button>
        }
      />

      {saved && (
        <Alert severity="success" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          Setările au fost salvate. Se aplică închirierilor create de acum înainte.
        </Alert>
      )}

      <Panel title="Datele firmei" subtitle="Denumire, CUI, reprezentant legal și sediu.">
        <Typography sx={{ fontSize: '0.88rem', color: DASHBOARD_TOKENS.textMuted }}>
          Se editează în{' '}
          <MuiLink component={RouterLink} to={SRL_PATHS.profile} sx={{ fontWeight: 700 }}>
            Profilul firmei
          </MuiLink>
          , ca să existe un singur loc de unde intră în contracte și facturi.
        </Typography>
      </Panel>

      <Panel
        title="Valori implicite pentru închiriere"
        subtitle="Precompletate la fiecare închiriere nouă. Rămân editabile înainte de generarea documentelor."
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Chirie standard / săptămână (lei)"
            type="number"
            value={lei(settings.weeklyRentBani)}
            onChange={(event) => update('weeklyRentBani', bani(event.target.value))}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          />
          <TextField
            label="Garanție standard (lei)"
            type="number"
            value={lei(settings.depositBani)}
            onChange={(event) => update('depositBani', bani(event.target.value))}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          />
          <TextField
            select
            label="Perioadă minimă"
            value={settings.minPeriodDays ?? ''}
            onChange={(event) => update('minPeriodDays', event.target.value === '' ? null : Number(event.target.value))}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {MIN_PERIODS.map((period) => (
              <MenuItem key={period.label} value={period.value ?? ''}>
                {period.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Regulă combustibil / energie"
            value={settings.fuelRule ?? ''}
            onChange={(event) => update('fuelRule', event.target.value || null)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            <MenuItem value="">Fără regulă</MenuItem>
            {FUEL_RULES.map((rule) => (
              <MenuItem key={rule} value={rule}>
                {rule}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Bifa și cifrele stau împreună: „cu limită" fără număr de km nu spune nimic, iar cifrele
            fără bifă rămân în formular fără să se aplice vreodată. */}
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={settings.hasKmLimit}
                onChange={(event) => {
                  const next = event.target.checked
                  setDefaults({
                    ...settings,
                    hasKmLimit: next,
                    mileageLimit: next ? settings.mileageLimit : null,
                  })
                  setSaved(false)
                }}
              />
            }
            label="Închirierile pornesc cu limită de kilometri"
            slotProps={{ typography: { sx: { fontSize: '0.88rem', fontWeight: 700 } } }}
          />

          {settings.hasKmLimit && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 1 }}>
              <TextField
                label="Km incluși"
                type="number"
                value={settings.mileageLimit ?? ''}
                onChange={(event) =>
                  update('mileageLimit', event.target.value === '' ? null : Number(event.target.value))
                }
                fullWidth
                size="small"
                sx={dashboardInputSx}
              />
              <TextField
                label="Cost km extra (lei)"
                type="number"
                value={lei(settings.extraKmCostBani)}
                onChange={(event) => update('extraKmCostBani', bani(event.target.value))}
                fullWidth
                size="small"
                sx={dashboardInputSx}
              />
            </Box>
          )}
        </Box>

        <TextField
          label="Condiții implicite"
          value={settings.defaultConditions ?? ''}
          onChange={(event) => update('defaultConditions', event.target.value || null)}
          fullWidth
          multiline
          minRows={2}
          size="small"
          sx={{ ...dashboardInputSx, mt: 2 }}
          helperText="Intră în contract ca punct de plecare. Se pot modifica la fiecare închiriere."
        />
      </Panel>
    </Stack>
  )
}
