import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded'

import { AddressSearch } from '../../../../cars/map/AddressSearch'
import { PinPicker } from '../../../../cars/map/LazyMaps'
import { MAPBOX_AVAILABLE } from '../../../../../lib/mapbox'
import type { PickupLocation } from '../../../../../services/company.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../../dashboardTheme'

/**
 * Locul de unde se preiau mașinile.
 *
 * Trei feluri de a-l stabili, în ordinea în care le încearcă oamenii: cauți adresa și primești
 * pinul odată cu ea, muți pinul dacă adresa a nimerit vizavi, sau scrii doar textul dacă n-ai
 * chef de hartă. Ultima variantă e valabilă — „București, Sector 3" e tot un răspuns la
 * întrebarea „unde vă găsesc" — și de aceea pinul nu e obligatoriu.
 *
 * Nu are comutator de vizibilitate. Sediul social din Profil are unul, fiindcă e o adresă
 * juridică pe care mulți n-o vor publică; asta e adresa la care aștepți pe cineva să vină după
 * mașină, iar completarea ei într-o secțiune numită „Unde ne găsiți" e chiar actul de a o
 * publica.
 */
interface PageLocationPanelProps {
  pickup: PickupLocation
  onChange: (pickup: PickupLocation) => void
}

export function PageLocationPanel({ pickup, onChange }: PageLocationPanelProps) {
  const pinned = pickup.latitude !== null && pickup.longitude !== null

  return (
    <Stack spacing={3}>
      <Box>
        <SubTitle>Adresa</SubTitle>

        {MAPBOX_AVAILABLE ? (
          <AddressSearch
            label="Caută adresa"
            value={pickup.address ?? ''}
            onPick={(result) =>
              onChange({
                ...pickup,
                address: result.label,
                latitude: result.latitude,
                longitude: result.longitude,
              })
            }
            helperText="Alegerea unei sugestii pune și pinul pe hartă."
          />
        ) : (
          <TextField
            label="Adresa"
            value={pickup.address ?? ''}
            onChange={(event) => onChange({ ...pickup, address: event.target.value.slice(0, 512) || null })}
            fullWidth
            size="small"
            sx={dashboardInputSx}
            helperText="Căutarea pe hartă are nevoie de configurarea Mapbox; adresa scrisă manual apare oricum."
          />
        )}

        {MAPBOX_AVAILABLE && pickup.address && (
          <TextField
            label="Adresa afișată"
            value={pickup.address}
            onChange={(event) => onChange({ ...pickup, address: event.target.value.slice(0, 512) || null })}
            fullWidth
            size="small"
            sx={{ ...dashboardInputSx, mt: 2 }}
            // Mapbox întoarce adresa completă, cu județ și cod poștal. Pe pagină arată încărcat,
            // iar omul își știe adresa mai bine decât geocoderul.
            helperText="Corecteaz-o cum vrei să apară pe pagină. Pinul rămâne unde e."
          />
        )}
      </Box>

      <Box>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.4 }}
        >
          <Box>
            <SubTitle>Pinul pe hartă</SubTitle>
            <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted, mt: -1 }}>
              {pinned
                ? 'Click sau trage pinul dacă adresa a nimerit peste drum.'
                : 'Opțional. Fără pin, secțiunea arată doar adresa scrisă.'}
            </Typography>
          </Box>
          {pinned && (
            <Button
              size="small"
              startIcon={<MyLocationRoundedIcon />}
              onClick={() => onChange({ ...pickup, latitude: null, longitude: null })}
              sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
            >
              Scoate pinul
            </Button>
          )}
        </Stack>

        <PinPicker
          latitude={pickup.latitude}
          longitude={pickup.longitude}
          onChange={(latitude, longitude) => onChange({ ...pickup, latitude, longitude })}
          height={320}
        />
      </Box>

      <TextField
        label="Cum ne găsești (opțional)"
        placeholder="Intrarea din spatele clădirii, lângă benzinărie. Sună înainte să vii."
        value={pickup.note ?? ''}
        onChange={(event) => onChange({ ...pickup, note: event.target.value.slice(0, 600) || null })}
        multiline
        minRows={3}
        fullWidth
        size="small"
        sx={dashboardInputSx}
        helperText={`${(pickup.note ?? '').length}/600 — apare lângă hartă.`}
      />
    </Stack>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink, mb: 1.4 }}>
      {children}
    </Typography>
  )
}
