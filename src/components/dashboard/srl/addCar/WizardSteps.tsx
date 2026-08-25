import { Alert, Box, Button, Chip, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

import { PinPicker } from '../../../cars/map/LazyMaps'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import {
  AVAILABILITY,
  BADGE_OPTIONS,
  ENGINES,
  MINIMUM_PERIODS,
  OFFER_TYPES,
  SEATS,
  TRANSMISSIONS,
  dossierCompletion,
  type CarDraft,
} from './wizardModel'

/**
 * Conținutul fiecărui pas. Separat de învelișul wizardului ca pașii să rămână citibili — un
 * singur fișier cu formular, navigare, upload și publicare devine imposibil de urmărit.
 */

type Update = <K extends keyof CarDraft>(key: K, value: CarDraft[K]) => void

const grid2 = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 2,
} as const

const fullWidth = { gridColumn: { xs: 'auto', sm: '1 / -1' } } as const

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink, mt: 1 }}>
      {children}
    </Typography>
  )
}

// ── 1. Vehicul ────────────────────────────────────────────────────────────────────────────

export function VehicleStep({ draft, update }: { draft: CarDraft; update: Update }) {
  return (
    <Stack spacing={2.5}>
      <Alert severity="info" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
        Mașina poate fi adăugată și publicată fără talon, RCA sau CASCO. Dosarul se completează
        oricând, la pasul 5.
      </Alert>

      <Box sx={grid2}>
        <TextField label="Marcă" required value={draft.brand} onChange={(e) => update('brand', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField label="Model" required value={draft.model} onChange={(e) => update('model', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField label="An fabricație" required type="number" value={draft.year} onChange={(e) => update('year', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField select label="Motorizare" value={draft.engine} onChange={(e) => update('engine', e.target.value)} fullWidth size="small" sx={dashboardInputSx}>
          {ENGINES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
        <TextField select label="Transmisie" value={draft.transmission} onChange={(e) => update('transmission', e.target.value)} fullWidth size="small" sx={dashboardInputSx}>
          {TRANSMISSIONS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
        <TextField label="Culoare" value={draft.color} onChange={(e) => update('color', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField select label="Număr locuri" value={draft.seats} onChange={(e) => update('seats', e.target.value)} fullWidth size="small" sx={dashboardInputSx}>
          {SEATS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
      </Box>

      <SectionTitle>Categorii ridesharing</SectionTitle>
      <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted, mt: -1.5 }}>
        Pe ce categorii poate rula mașina. Se folosesc ca filtru în marketplace.
      </Typography>
      <Box sx={grid2}>
        <TextField
          label="Categorii Uber"
          value={draft.uberCategories.join(', ')}
          onChange={(e) => update('uberCategories', splitList(e.target.value))}
          fullWidth
          size="small"
          sx={dashboardInputSx}
          placeholder="UberX, Comfort"
          helperText="Separate prin virgulă."
        />
        <TextField
          label="Categorii Bolt"
          value={draft.boltCategories.join(', ')}
          onChange={(e) => update('boltCategories', splitList(e.target.value))}
          fullWidth
          size="small"
          sx={dashboardInputSx}
          placeholder="Bolt, Comfort"
          helperText="Separate prin virgulă."
        />
      </Box>
    </Stack>
  )
}

/** Lista scrisă cu virgule, curățată de spații și de intrări goale. */
function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

// ── 2. Ofertă ─────────────────────────────────────────────────────────────────────────────

export function OfferStep({ draft, update }: { draft: CarDraft; update: Update }) {
  return (
    <Stack spacing={2.5}>
      <Box sx={grid2}>
        <TextField label="Preț / săptămână (lei)" required type="number" value={draft.pricePerWeek} onChange={(e) => update('pricePerWeek', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField label="Garanție (lei)" type="number" value={draft.garantie} onChange={(e) => update('garantie', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField select label="Tip ofertă" value={draft.offerType} onChange={(e) => update('offerType', e.target.value)} fullWidth size="small" sx={dashboardInputSx}>
          {OFFER_TYPES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
        <TextField select label="Perioadă minimă" value={draft.minimumPeriod} onChange={(e) => update('minimumPeriod', e.target.value)} fullWidth size="small" sx={dashboardInputSx}>
          {MINIMUM_PERIODS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
        <TextField select label="Disponibilitate" value={draft.status} onChange={(e) => update('status', e.target.value)} fullWidth size="small" sx={dashboardInputSx}>
          {AVAILABILITY.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
        {/* Data apare doar când e cerută de opțiunea aleasă — altfel ar fi un câmp mort. */}
        {draft.status === 'Disponibilă de la o dată' && (
          <TextField
            label="Disponibilă din"
            type="date"
            value={draft.availableFrom}
            onChange={(e) => update('availableFrom', e.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}
        <TextField label="Condiții principale" value={draft.conditions} onChange={(e) => update('conditions', e.target.value)} fullWidth multiline minRows={2} size="small" sx={{ ...dashboardInputSx, ...fullWidth }} placeholder="Garanție 500 lei. Perioadă minimă 2 luni. Notificare cu 7 zile înainte de predare." />
        <TextField
          label="Descriere publică"
          required
          value={draft.description}
          onChange={(e) => update('description', e.target.value)}
          fullWidth
          multiline
          minRows={4}
          size="small"
          sx={{ ...dashboardInputSx, ...fullWidth }}
          helperText={`${draft.description.trim().length} caractere — de la 200 anunțul primește punctajul complet la „Recomandate".`}
        />
      </Box>

      <SectionTitle>Avantaje afișate pe anunț</SectionTitle>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {BADGE_OPTIONS.map((badge) => {
          const on = draft.badges.includes(badge)
          return (
            <Chip
              key={badge}
              label={badge}
              onClick={() =>
                update('badges', on ? draft.badges.filter((b) => b !== badge) : [...draft.badges, badge])
              }
              sx={{
                fontWeight: 700,
                borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
                border: `1px solid ${on ? alpha(DASHBOARD_TOKENS.primary, 0.4) : DASHBOARD_TOKENS.border}`,
                bgcolor: on ? alpha(DASHBOARD_TOKENS.primary, 0.1) : 'transparent',
                color: on ? DASHBOARD_TOKENS.primaryStrong : DASHBOARD_TOKENS.textMuted,
              }}
            />
          )
        })}
      </Stack>
    </Stack>
  )
}

// ── 3. Poze ───────────────────────────────────────────────────────────────────────────────

export interface DraftPhoto {
  id: string
  file: File
  url: string
}

export function PhotosStep({
  photos,
  onAdd,
  onRemove,
  onMakeCover,
}: {
  photos: DraftPhoto[]
  onAdd: (files: FileList | null) => void
  onRemove: (id: string) => void
  onMakeCover: (id: string) => void
}) {
  return (
    <Stack spacing={2.5}>
      <Button
        component="label"
        variant="outlined"
        startIcon={<CloudUploadRoundedIcon />}
        sx={{
          py: 3,
          borderStyle: 'dashed',
          borderWidth: 2,
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        Încarcă fotografiile mașinii
        <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, fontWeight: 500 }}>
          Selectează din telefon sau PC. JPG, PNG sau WEBP.
        </Typography>
        <input
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            onAdd(e.target.files)
            e.target.value = ''
          }}
        />
      </Button>

      {photos.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          {photos.map((photo, index) => (
            <Box
              key={photo.id}
              sx={{
                position: 'relative',
                aspectRatio: '4 / 3',
                borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                overflow: 'hidden',
                border: `1px solid ${index === 0 ? alpha(DASHBOARD_TOKENS.primary, 0.5) : DASHBOARD_TOKENS.border}`,
              }}
            >
              <Box component="img" src={photo.url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              {index === 0 ? (
                <Box sx={coverBadgeSx}>Principală</Box>
              ) : (
                <Button size="small" onClick={() => onMakeCover(photo.id)} sx={makeCoverSx}>
                  Fă principală
                </Button>
              )}

              <Button
                size="small"
                aria-label="Șterge fotografia"
                onClick={() => onRemove(photo.id)}
                sx={removeSx}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
              </Button>
            </Box>
          ))}
        </Box>
      )}

      <Alert
        severity={photos.length >= 6 ? 'success' : 'info'}
        sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
      >
        {photos.length >= 6
          ? 'Ai destule fotografii pentru punctajul complet la „Recomandate".'
          : `${photos.length} din 6 fotografii. De la 3 anunțul primește punctaj, de la 6 punctajul complet.`}
      </Alert>
    </Stack>
  )
}

const coverBadgeSx = {
  position: 'absolute',
  top: 6,
  left: 6,
  px: 0.9,
  py: 0.2,
  borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
  bgcolor: DASHBOARD_TOKENS.primaryStrong,
  color: DASHBOARD_TOKENS.paper,
  fontSize: '0.66rem',
  fontWeight: 800,
} as const

const makeCoverSx = {
  position: 'absolute',
  bottom: 6,
  left: 6,
  minWidth: 0,
  px: 0.9,
  py: 0.1,
  fontSize: '0.66rem',
  fontWeight: 700,
  textTransform: 'none',
  bgcolor: alpha('#FFFFFF', 0.92),
  color: DASHBOARD_TOKENS.ink,
  '&:hover': { bgcolor: '#FFFFFF' },
} as const

const removeSx = {
  position: 'absolute',
  top: 4,
  right: 4,
  minWidth: 0,
  p: 0.4,
  color: DASHBOARD_TOKENS.stateError,
  bgcolor: alpha('#FFFFFF', 0.92),
  '&:hover': { bgcolor: '#FFFFFF' },
} as const

// ── 4. Locație ────────────────────────────────────────────────────────────────────────────

export function LocationStep({ draft, update }: { draft: CarDraft; update: Update }) {
  const hasPin = draft.latitude != null && draft.longitude != null

  return (
    <Stack spacing={2.5}>
      <Box sx={grid2}>
        <TextField label="Oraș" required value={draft.location} onChange={(e) => update('location', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField label="Zonă / cartier" value={draft.zone} onChange={(e) => update('zone', e.target.value)} fullWidth size="small" sx={dashboardInputSx} helperText="Se afișează public când pinul exact e ascuns." />
        <TextField
          label="Latitudine"
          type="number"
          value={draft.latitude ?? ''}
          onChange={(e) => update('latitude', e.target.value === '' ? null : Number(e.target.value))}
          fullWidth
          size="small"
          sx={dashboardInputSx}
        />
        <TextField
          label="Longitudine"
          type="number"
          value={draft.longitude ?? ''}
          onChange={(e) => update('longitude', e.target.value === '' ? null : Number(e.target.value))}
          fullWidth
          size="small"
          sx={dashboardInputSx}
        />
      </Box>

      <SectionTitle>Pinul de preluare</SectionTitle>
      <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted, mt: -1.5 }}>
        Două căi, oricare e de ajuns: apeși pe hartă și tragi pinul unde vrei, sau scrii direct
        coordonatele de mai sus. Ce alegi într-un loc apare în celălalt.
      </Typography>

      <PinPicker
        latitude={draft.latitude}
        longitude={draft.longitude}
        onChange={(lat, lng) => {
          update('latitude', lat)
          update('longitude', lng)
        }}
      />

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Alert
          severity={hasPin ? 'success' : 'info'}
          sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, flex: 1 }}
        >
          {hasPin
            ? 'Pinul e setat. Anunțul primește punctajul pentru locație pe hartă.'
            : 'Fără pin, anunțul apare doar cu orașul și pierde 10 puncte la „Recomandate".'}
        </Alert>
        {hasPin && (
          <Button
            onClick={() => {
              update('latitude', null)
              update('longitude', null)
            }}
            sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}
          >
            Șterge pinul
          </Button>
        )}
      </Stack>

      <SectionTitle>Ce afișăm public</SectionTitle>
      <ToggleRow
        label="Locație exactă"
        hint="Dacă e oprit, publicul vede doar orașul și zona."
        checked={draft.showExactLocation}
        onChange={(v) => update('showExactLocation', v)}
      />
      <ToggleRow
        label="Folosește contactele firmei"
        hint="Telefon, email și WhatsApp după setările din Profil."
        checked={draft.useCompanyContacts}
        onChange={(v) => update('useCompanyContacts', v)}
      />
    </Stack>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.2,
        borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>{hint}</Typography>
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} slotProps={{ input: { 'aria-label': label } }} />
    </Stack>
  )
}

// ── 5. Dosar ──────────────────────────────────────────────────────────────────────────────

export function DossierStep({ draft, update }: { draft: CarDraft; update: Update }) {
  const completion = Math.round(dossierCompletion(draft) * 100)

  return (
    <Stack spacing={2.5}>
      <Alert severity="info" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
        Pas opțional. Nu blochează publicarea, dar completează dosarul digital și devine obligatoriu
        înainte de generarea primului contract de închiriere.
      </Alert>

      <Box sx={grid2}>
        <TextField label="Număr înmatriculare" value={draft.plateNumber} onChange={(e) => update('plateNumber', e.target.value)} fullWidth size="small" sx={dashboardInputSx} placeholder="B 123 RID" />
        <TextField label="VIN" value={draft.vin} onChange={(e) => update('vin', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField label="Kilometraj curent" type="number" value={draft.mileage} onChange={(e) => update('mileage', e.target.value)} fullWidth size="small" sx={dashboardInputSx} />
        <TextField
          label="Data primei înmatriculări"
          type="date"
          value={draft.firstRegistration}
          onChange={(e) => update('firstRegistration', e.target.value)}
          fullWidth
          size="small"
          sx={dashboardInputSx}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.8 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink }}>
            Dosar completat
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: DASHBOARD_TOKENS.accent }}>
            {completion}%
          </Typography>
        </Stack>
        <Box sx={{ height: 6, borderRadius: 999, bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.08), overflow: 'hidden' }}>
          <Box sx={{ width: `${completion}%`, height: '100%', bgcolor: DASHBOARD_TOKENS.accent }} />
        </Box>
        <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.8 }}>
          De la 80% anunțul primește punctajul pentru dosar la „Recomandate".
        </Typography>
      </Box>

      <Alert severity="info" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
        Documentele mașinii — talon, RCA, CASCO, ITP, copie conformă — se încarcă din dosarul
        mașinii, după ce anunțul e salvat.
      </Alert>
    </Stack>
  )
}
