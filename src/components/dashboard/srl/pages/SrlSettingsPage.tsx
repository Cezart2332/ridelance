import { useState } from 'react'
import { Alert, Box, Button, Link as MuiLink, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { SRL_PATHS } from '../../../../config/srlNavigation'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { PageHeader, Panel } from '../../ui'
import { settingsMock } from '../mocks/srl.mock'
import { usePendingBackend } from '../pendingBackendContext'
import type { SrlSettings } from '../types'
import { useSrlMock } from '../useSrlMock'

/**
 * Setările SRL — **doar preferințe operaționale** (spec §3.1).
 *
 * Datele de identitate ale firmei nu mai sunt aici: CUI-ul editabil din două locuri e un mod
 * garantat de a ajunge cu două CUI-uri diferite pe două documente. Au plecat în Profil, iar
 * pagina asta păstrează doar un link către ele.
 */

const PERIODS = ['2 luni', '1 lună', 'Fără perioadă minimă']
const KM_LIMITS: SrlSettings['kmLimit'][] = ['Fără limită', 'Cu limită']
const FUEL_RULES = ['Cel puțin nivelul de la preluare', 'Plin - plin']

export function SrlSettingsPage() {
  const notifyPending = usePendingBackend()
  const { data, loading, error } = useSrlMock(settingsMock)
  const [draft, setDraft] = useState<SrlSettings | null>(null)

  const settings = draft ?? data

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={340} />
      </Stack>
    )
  }

  if (error || !settings) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error ?? 'Nu am putut încărca setările.'}
        </Alert>
      </Box>
    )
  }

  const update = <K extends keyof SrlSettings>(key: K, value: SrlSettings[K]) => {
    setDraft({ ...settings, [key]: value })
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
            onClick={() => notifyPending('Salvarea setărilor')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Salvează
          </Button>
        }
      />

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
            value={settings.defaultWeeklyRentBani / 100}
            onChange={(event) => update('defaultWeeklyRentBani', Math.round(Number(event.target.value) * 100))}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          />
          <TextField
            label="Garanție standard (lei)"
            type="number"
            value={settings.defaultDepositBani / 100}
            onChange={(event) => update('defaultDepositBani', Math.round(Number(event.target.value) * 100))}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          />
          <TextField
            select
            label="Perioadă minimă"
            value={settings.minimumPeriod}
            onChange={(event) => update('minimumPeriod', event.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {PERIODS.map((period) => (
              <MenuItem key={period} value={period}>
                {period}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Limită km"
            value={settings.kmLimit}
            onChange={(event) => update('kmLimit', event.target.value as SrlSettings['kmLimit'])}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {KM_LIMITS.map((limit) => (
              <MenuItem key={limit} value={limit}>
                {limit}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Cost km extra (lei)"
            type="number"
            value={settings.extraKmCostBani / 100}
            onChange={(event) => update('extraKmCostBani', Math.round(Number(event.target.value) * 100))}
            fullWidth
            size="small"
            sx={dashboardInputSx}
            disabled={settings.kmLimit === 'Fără limită'}
            helperText={settings.kmLimit === 'Fără limită' ? 'Se aplică doar la închirierile cu limită de km.' : undefined}
          />
          <TextField
            select
            label="Regulă combustibil / energie"
            value={settings.fuelRule}
            onChange={(event) => update('fuelRule', event.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {FUEL_RULES.map((rule) => (
              <MenuItem key={rule} value={rule}>
                {rule}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Panel>
    </Stack>
  )
}
