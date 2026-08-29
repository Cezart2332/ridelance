import { useCallback, useRef, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'

import {
  carsService,
  getCarImageUrl,
  type Car,
  type CarListingDetails,
} from '../../../services/cars.service'
import { BOLT_CATEGORIES, CAR_BRANDS, CAR_BRANDS_DATA, UBER_CATEGORIES } from '../../../data/carCatalog'
import {
  OFFER_TYPE_FROM_API,
  OFFER_TYPE_TO_API,
  STATUS_FROM_API,
  STATUS_TO_API,
  LISTING_SOURCE_FROM_API,
  LISTING_SOURCE_TO_API,
} from '../../../utils/carLabels'
import { AddressSearch } from '../../cars/map/AddressSearch'
import { PinPicker } from '../../cars/map/LazyMaps'
import { reverseGeocode } from '../../../lib/geocoding'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { TalonScan } from './TalonScan'

/**
 * Editarea unei mașini.
 *
 * Înainte era un formular unic, de patru secțiuni numerotate, într-un dialog care se derula cât
 * trei ecrane: cine intra să schimbe prețul trecea peste hartă, peste categorii și peste galerie.
 * Aici aceleași câmpuri stau pe cinci taburi, fiecare cu o singură întrebare — ce e mașina, ce
 * scrie în anunț, cât costă, unde e, cum arată.
 *
 * Ce se salvează e neschimbat: același payload, aceeași ordine (întâi mașina, apoi pozele noi).
 * `details` pleacă întreg, nu parțial — pe server `Apply` suprascrie tot obiectul, deci o
 * trimitere parțială ar șterge numărul de înmatriculare și VIN-ul, adică exact ce cere contractul.
 */

/** Punctul de plecare când mașina n-are încă detalii. */
const BLANK_DETAILS: CarListingDetails = {
  zone: null,
  latitude: null,
  longitude: null,
  showExactLocation: false,
  useCompanyContacts: true,
  color: null,
  seats: null,
  minimumPeriod: null,
  conditions: null,
  availableFromUtc: null,
  plateNumber: null,
  vin: null,
  mileage: null,
  firstRegistrationAtUtc: null,
}

const BADGES = ['Consum Mic', 'Hybrid', 'GPL', 'Top Rated', 'Nou', 'Reducere']
const ENGINES = ['Electric', 'Hybrid', 'GPL', 'Benzină', 'Diesel']
const TRANSMISSIONS = ['Automată', 'Manuală']
const OFFER_TYPES = ['Închiriere săptămânală', 'La rămânere']
const AVAILABILITY = ['Disponibilă acum', 'În curând', 'Indisponibilă', 'În service']

interface LocalImage {
  id: string
  previewUrl: string
  file?: File
  isExisting?: boolean
}

type TabId = 'masina' | 'anunt' | 'pret' | 'locatie' | 'foto'

/** Taburile, cu tabul pe care trebuie deschisă fiecare eroare de validare. */
const TABS: { id: TabId; label: string }[] = [
  { id: 'masina', label: 'Mașina' },
  { id: 'anunt', label: 'Anunț' },
  { id: 'pret', label: 'Preț' },
  { id: 'locatie', label: 'Locație' },
  { id: 'foto', label: 'Fotografii' },
]

export interface CarEditDialogProps {
  open: boolean
  /**
   * Mașina editată.
   *
   * Dialogul nu adaugă mașini: și adminul, și proprietarul trec prin wizardul pe șase pași, care
   * are unde să încapă. `null` înseamnă doar că nu e nimic de editat, deci nu se randează.
   */
  car: Car | null
  /** Adminul publică direct; proprietarul trece prin plată și validare. */
  mode: 'admin' | 'owner'
  onClose: () => void
  onSaved: () => void
}

/**
 * Dialogul se montează abia când se deschide, iar conținutul poartă `key`-ul mașinii.
 *
 * Așa starea pornește din props, la montare, în loc să fie resetată de un efect la fiecare
 * deschidere — altfel dialogul ar fi păstrat ce a tastat cineva pentru mașina precedentă, iar
 * corectura ar fi însemnat un setState în efect, adică o randare în plus la fiecare deschidere.
 */
export function CarEditDialog({ open, car, ...rest }: CarEditDialogProps) {
  if (!open || !car) return null

  return <CarEditForm key={car.id} car={car} {...rest} />
}

/** Punctul de plecare al formularului: mașina, cu etichetele traduse din valorile API. */
function initialDraft(car: Car): Partial<Car> {
  return {
    ...car,
    offerType: OFFER_TYPE_FROM_API[car.offerType] ?? car.offerType,
    status: STATUS_FROM_API[car.status] ?? car.status,
    listingSource: LISTING_SOURCE_FROM_API[car.listingSource] ?? car.listingSource,
  }
}

function CarEditForm({ car, mode, onClose, onSaved }: Omit<CarEditDialogProps, 'open' | 'car'> & { car: Car }) {
  const isOwner = mode === 'owner'
  const [draft, setDraft] = useState<Partial<Car>>(() => initialDraft(car))
  const [images, setImages] = useState<LocalImage[]>(() =>
    car.images.map((img) => ({ id: img.id, previewUrl: getCarImageUrl(img.imageUrl), isExisting: true })),
  )
  const [tab, setTab] = useState<TabId>('masina')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const details: CarListingDetails = { ...BLANK_DETAILS, ...draft.details }

  const patch = (values: Partial<Car>) => setDraft((prev) => ({ ...prev, ...values }))

  const patchDetails = (values: Partial<CarListingDetails>) =>
    setDraft((prev) => ({ ...prev, details: { ...BLANK_DETAILS, ...prev.details, ...values } }))

  /** Pinul mutat completează orașul și zona înapoi, la fel ca în wizard. */
  const placePin = (latitude: number, longitude: number) => {
    patchDetails({ latitude, longitude })
    void reverseGeocode(latitude, longitude).then((place) => {
      if (!place) return
      setDraft((prev) => ({
        ...prev,
        location: place.city ?? prev.location,
        details: {
          ...BLANK_DETAILS,
          ...prev.details,
          latitude,
          longitude,
          zone: place.zone ?? prev.details?.zone ?? null,
        },
      }))
    })
  }

  // Fără `useMemo`: e un `find` peste câteva zeci de mărci, iar compilatorul React îl memoizează
  // oricum — o dependență scrisă de mână ar fi doar un lucru în plus care se poate desincroniza.
  const models = CAR_BRANDS_DATA.find(
    (item) => item.brand.toLowerCase() === (draft.brand ?? '').toLowerCase(),
  )?.models ?? []

  const addFiles = useCallback((files: FileList | File[]) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const valid = Array.from(files).filter((f) => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024)
    setImages((prev) => [
      ...prev,
      ...valid.map((file) => ({
        id: Math.random().toString(36).slice(2),
        previewUrl: URL.createObjectURL(file),
        file,
      })),
    ])
  }, [])

  const removeImage = async (id: string) => {
    const image = images.find((i) => i.id === id)
    if (!image) return

    // O poză deja urcată se șterge de pe server pe loc; una doar aleasă se uită local.
    if (image.isExisting && draft?.id) {
      try {
        await carsService.deleteImage(draft.id, id)
      } catch (cause) {
        setError(messageOf(cause, 'Nu am putut șterge imaginea.'))
        return
      }
    } else if (image.file) {
      URL.revokeObjectURL(image.previewUrl)
    }

    setImages((prev) => prev.filter((i) => i.id !== id))
  }

  /**
   * Ce lipsește ca să se poată salva, cu tabul unde se completează.
   *
   * Ca la generarea documentelor: problema se spune o dată, cu drumul către ea, nu ca un mesaj
   * care lasă omul să caute câmpul prin cinci taburi.
   */
  const problem = ((): { tab: TabId; message: string } | null => {
    if (!draft.brand?.trim() || !draft.model?.trim()) {
      return { tab: 'masina', message: 'Completează marca și modelul.' }
    }
    if (!draft.pricePerWeek || draft.pricePerWeek <= 0) {
      return { tab: 'pret', message: 'Pune un preț pe săptămână.' }
    }
    if (draft.discountActive && (draft.oldPrice == null || draft.oldPrice <= draft.pricePerWeek)) {
      return { tab: 'pret', message: 'La reducere activă, prețul vechi trebuie să fie mai mare decât cel actual.' }
    }
    return null
  })()

  const save = async () => {
    if (problem) {
      setTab(problem.tab)
      setError(problem.message)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        brand: draft.brand!,
        model: draft.model!,
        year: draft.year!,
        engine: draft.engine!,
        transmission: draft.transmission!,
        location: draft.location!,
        pricePerWeek: draft.pricePerWeek!,
        oldPrice: draft.oldPrice,
        discountActive: draft.discountActive ?? false,
        garantie: draft.garantie,
        offerType: OFFER_TYPE_TO_API[draft.offerType!] || draft.offerType!,
        status: STATUS_TO_API[draft.status!] || draft.status!,
        uberCategories: draft.uberCategories ?? [],
        boltCategories: draft.boltCategories ?? [],
        badges: draft.badges ?? [],
        description: draft.description ?? '',
        active: draft.active ?? !isOwner,
        listingSource:
          LISTING_SOURCE_TO_API[draft.listingSource as string] ?? draft.listingSource ?? 'Ridelance',
        details: draft.details,
      }

      await carsService.update(car.id, payload)

      for (const image of images.filter((i) => !i.isExisting && i.file)) {
        await carsService.uploadImage(car.id, image.file!)
      }

      onSaved()
    } catch (cause) {
      setError(messageOf(cause, 'Nu am putut salva mașina.'))
    } finally {
      setSaving(false)
    }
  }

  const title = `${draft.brand} ${draft.model}`.trim() || 'Editează mașina'

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: `${DASHBOARD_TOKENS.radius.xl}px` } } }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.6, pb: 2 }}
        >
          <Stack direction="row" spacing={1.6} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.1),
                color: DASHBOARD_TOKENS.accent,
              }}
            >
              <DirectionsCarFilledRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 900, fontSize: '1.05rem', color: DASHBOARD_TOKENS.ink }}>
                {title}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
                Modificările se văd în anunț imediat ce salvezi.
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} disabled={saving} size="small" aria-label="Închide">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, next: TabId) => setTab(next)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              minHeight: 44,
              color: DASHBOARD_TOKENS.textMuted,
              '&.Mui-selected': { color: DASHBOARD_TOKENS.accent },
            },
          }}
        >
          {TABS.map((entry) => (
            <Tab
              key={entry.id}
              value={entry.id}
              label={entry.id === 'foto' && images.length > 0 ? `${entry.label} (${images.length})` : entry.label}
            />
          ))}
        </Tabs>
      </DialogTitle>

      {saving && <LinearProgress />}

      <DialogContent sx={{ px: 3, py: 2.6 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.2, borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
            {error}
          </Alert>
        )}

        {tab === 'masina' && (
          <Stack spacing={2.6}>
            <Field label="Ce mașină e" hint="Marca și modelul apar în anunț și în contracte.">
              <Grid2>
                <Autocomplete
                  freeSolo
                  options={CAR_BRANDS}
                  value={draft.brand ?? ''}
                  onChange={(_, value) => patch({ brand: value ?? '', model: '' })}
                  onInputChange={(_, value) => patch({ brand: value, model: '' })}
                  renderInput={(params) => (
                    <TextField {...params} label="Marcă" size="small" fullWidth sx={dashboardInputSx} />
                  )}
                />
                <Autocomplete
                  freeSolo
                  options={models}
                  value={draft.model ?? ''}
                  onChange={(_, value) => patch({ model: value ?? '' })}
                  onInputChange={(_, value) => patch({ model: value })}
                  renderInput={(params) => (
                    <TextField {...params} label="Model" size="small" fullWidth sx={dashboardInputSx} />
                  )}
                />
                <TextField
                  label="An de fabricație"
                  type="number"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={draft.year ?? ''}
                  onChange={(e) => patch({ year: parseInt(e.target.value, 10) })}
                />
                <TextField
                  select
                  label="Motorizare"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={draft.engine ?? 'GPL'}
                  onChange={(e) => patch({ engine: e.target.value })}
                >
                  {ENGINES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Cutie de viteze"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={draft.transmission ?? 'Manuală'}
                  onChange={(e) => patch({ transmission: e.target.value })}
                >
                  {TRANSMISSIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Culoare"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={details.color ?? ''}
                  onChange={(e) => patchDetails({ color: e.target.value || null })}
                />
              </Grid2>
            </Field>

            {/* Numărul și VIN-ul nu sunt pentru anunț: fără ele nu se poate genera contractul. */}
            <Field label="Identificare" hint="Contractul și procesele-verbale le cer pe toate trei.">
              <Stack spacing={2}>
                <TalonScan
                  onRead={(scan) =>
                    // Forma funcțională, nu `details`: ce s-a citit se așază peste starea curentă,
                    // nu peste cea din randarea în care s-a apăsat butonul.
                    setDraft((prev) => ({
                      ...prev,
                      details: {
                        ...BLANK_DETAILS,
                        ...prev.details,
                        plateNumber: scan.plateNumber?.value ?? prev.details?.plateNumber ?? null,
                        vin: scan.vin?.value ?? prev.details?.vin ?? null,
                      },
                    }))
                  }
                />
                <Grid2>
                <TextField
                  label="Număr de înmatriculare"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={details.plateNumber ?? ''}
                  onChange={(e) => patchDetails({ plateNumber: e.target.value.toUpperCase() || null })}
                />
                <TextField
                  label="Serie de șasiu (VIN)"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={details.vin ?? ''}
                  onChange={(e) => patchDetails({ vin: e.target.value.toUpperCase() || null })}
                />
                <TextField
                  label="Kilometraj"
                  type="number"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={details.mileage ?? ''}
                  onChange={(e) => patchDetails({ mileage: e.target.value ? Number(e.target.value) : null })}
                />
                <TextField
                  label="Număr de locuri"
                  type="number"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={details.seats ?? ''}
                  onChange={(e) => patchDetails({ seats: e.target.value ? Number(e.target.value) : null })}
                />
                </Grid2>
              </Stack>
            </Field>
          </Stack>
        )}

        {tab === 'anunt' && (
          <Stack spacing={2.6}>
            <Field label="Cum se oferă" hint="Ce vede cineva care caută o mașină.">
              <Grid2>
                <TextField
                  select
                  label="Tip de ofertă"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={draft.offerType ?? OFFER_TYPES[0]}
                  onChange={(e) => patch({ offerType: e.target.value })}
                >
                  {OFFER_TYPES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Disponibilitate"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  value={draft.status ?? AVAILABILITY[0]}
                  onChange={(e) => patch({ status: e.target.value })}
                >
                  {AVAILABILITY.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid2>
            </Field>

            <Field label="Pe ce platforme intră" hint="Categoriile pe care le poate acoperi mașina.">
              <Grid2>
                <Autocomplete
                  multiple
                  options={UBER_CATEGORIES}
                  value={draft.uberCategories ?? []}
                  onChange={(_, value) => patch({ uberCategories: value })}
                  renderInput={(params) => (
                    <TextField {...params} label="Categorii Uber" size="small" sx={dashboardInputSx} />
                  )}
                />
                <Autocomplete
                  multiple
                  options={BOLT_CATEGORIES}
                  value={draft.boltCategories ?? []}
                  onChange={(_, value) => patch({ boltCategories: value })}
                  renderInput={(params) => (
                    <TextField {...params} label="Categorii Bolt" size="small" sx={dashboardInputSx} />
                  )}
                />
              </Grid2>
            </Field>

            <Field label="Descriere" hint="Dotări, istoric, condiții — ce n-a încăput în câmpuri.">
              <Stack spacing={2}>
                <Autocomplete
                  multiple
                  options={BADGES}
                  value={draft.badges ?? []}
                  onChange={(_, value) => patch({ badges: value })}
                  renderInput={(params) => (
                    <TextField {...params} label="Etichete" size="small" sx={dashboardInputSx} />
                  )}
                />
                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  size="small"
                  sx={dashboardInputSx}
                  placeholder="Mașină nefumători, cauciucuri noi, revizie făcută la 90.000 km…"
                  value={draft.description ?? ''}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </Stack>
            </Field>
          </Stack>
        )}

        {tab === 'pret' && (
          <Stack spacing={2.6}>
            <Field label="Cât costă" hint="Prețul afișat în anunț. Chiria unei închirieri se poate abate de la el.">
              <Grid2>
                <TextField
                  label="Preț pe săptămână"
                  type="number"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">lei</InputAdornment> } }}
                  value={draft.pricePerWeek ?? ''}
                  onChange={(e) => patch({ pricePerWeek: parseFloat(e.target.value) })}
                />
                <TextField
                  label="Garanție"
                  type="number"
                  size="small"
                  fullWidth
                  sx={dashboardInputSx}
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">lei</InputAdornment> } }}
                  value={draft.garantie ?? ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    patch({ garantie: Number.isNaN(value) ? undefined : value })
                  }}
                />
              </Grid2>
            </Field>

            <Field label="Reducere" hint="Prețul vechi se taie în anunț. Are sens doar dacă e mai mare.">
              <Stack spacing={1.6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.discountActive ?? false}
                      onChange={(e) => patch({ discountActive: e.target.checked })}
                    />
                  }
                  label={<Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>Arată o reducere</Typography>}
                />
                {draft.discountActive && (
                  <TextField
                    label="Preț înainte de reducere"
                    type="number"
                    size="small"
                    sx={{ ...dashboardInputSx, maxWidth: 280 }}
                    slotProps={{ input: { endAdornment: <InputAdornment position="end">lei</InputAdornment> } }}
                    value={draft.oldPrice ?? ''}
                    onChange={(e) => patch({ oldPrice: parseFloat(e.target.value) || undefined })}
                  />
                )}
              </Stack>
            </Field>

            {/* Adminul poate publica direct. Proprietarul nu: anunțul lui trece prin plată și
                validare, iar un comutator aici ar fi promis o vizibilitate pe care n-o dă. */}
            {!isOwner && (
              <Field label="Vizibilitate" hint="Anunțurile adăugate de admin se publică fără validare.">
                <FormControlLabel
                  control={
                    <Switch checked={draft.active ?? true} onChange={(e) => patch({ active: e.target.checked })} />
                  }
                  label={<Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>Vizibil în marketplace</Typography>}
                />
              </Field>
            )}

          </Stack>
        )}

        {tab === 'locatie' && (
          <Stack spacing={2.2}>
            <Field label="Unde se predă mașina" hint="Caută adresa sau pune pinul direct pe hartă.">
              <Stack spacing={1.8}>
                <AddressSearch
                  value={details.latitude != null ? (draft.location ?? '') : ''}
                  onPick={(place) => {
                    setDraft((prev) => ({
                      ...prev,
                      location: place.city ?? prev.location,
                      details: {
                        ...BLANK_DETAILS,
                        ...prev.details,
                        latitude: place.latitude,
                        longitude: place.longitude,
                        zone: place.zone ?? prev.details?.zone ?? null,
                      },
                    }))
                  }}
                />
                <PinPicker latitude={details.latitude} longitude={details.longitude} onChange={placePin} />
                <Grid2>
                  <TextField
                    label="Oraș"
                    size="small"
                    fullWidth
                    sx={dashboardInputSx}
                    value={draft.location ?? ''}
                    onChange={(e) => patch({ location: e.target.value })}
                  />
                  <TextField
                    label="Zonă sau cartier"
                    size="small"
                    fullWidth
                    sx={dashboardInputSx}
                    value={details.zone ?? ''}
                    onChange={(e) => patchDetails({ zone: e.target.value || null })}
                  />
                </Grid2>
                {details.latitude != null && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <PlaceRoundedIcon sx={{ fontSize: 16, color: DASHBOARD_TOKENS.accent }} />
                    <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
                      Pin pus pe hartă.
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => patchDetails({ latitude: null, longitude: null })}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Șterge pinul
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Field>
          </Stack>
        )}

        {tab === 'foto' && (
          <Stack spacing={2}>
            <Box
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
              }}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                py: 4,
                px: 2,
                borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
                border: `1.5px dashed ${dragOver ? DASHBOARD_TOKENS.accent : DASHBOARD_TOKENS.borderHover}`,
                bgcolor: dragOver ? alpha(DASHBOARD_TOKENS.accent, 0.04) : DASHBOARD_TOKENS.surface,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: 'border-color 150ms ease, background-color 150ms ease',
                '&:hover': { borderColor: DASHBOARD_TOKENS.accent },
              }}
            >
              <CloudUploadRoundedIcon sx={{ fontSize: 30, color: DASHBOARD_TOKENS.textSubtle, mb: 0.8 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
                Trage pozele aici sau apasă ca să le alegi
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
                JPG, PNG sau WEBP, până în 10 MB fiecare
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                style={{ display: 'none' }}
              />
            </Box>

            {images.length === 0 ? (
              <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>
                Anunțurile cu poze primesc de câteva ori mai multe cereri. Prima poză e cea din listă.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.4 }}>
                {images.map((image, index) => (
                  <Box
                    key={image.id}
                    sx={{
                      position: 'relative',
                      aspectRatio: '4 / 3',
                      borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                      overflow: 'hidden',
                      border: `1px solid ${DASHBOARD_TOKENS.border}`,
                    }}
                  >
                    <Box
                      component="img"
                      src={image.previewUrl}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {index === 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 6,
                          left: 6,
                          px: 0.9,
                          py: 0.2,
                          borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
                          bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.72),
                          color: '#fff',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                        }}
                      >
                        Prima poză
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      aria-label="Șterge poza"
                      onClick={() => void removeImage(image.id)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: alpha('#fff', 0.9),
                        color: DASHBOARD_TOKENS.stateError,
                        p: 0.4,
                        '&:hover': { bgcolor: '#fff' },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.2,
          borderTop: `1px solid ${DASHBOARD_TOKENS.border}`,
          justifyContent: 'space-between',
        }}
      >
        {/* Ce lipsește se scrie lângă butonul de salvare, nu doar după ce s-a apăsat degeaba. */}
        <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, minWidth: 0 }}>
          {problem ? problem.message : ''}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}
          >
            Renunță
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => void save()}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 800, px: 3, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            {saving ? 'Se salvează…' : 'Salvează'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}

/** Un grup de câmpuri: titlu, o linie de context, conținut. */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: DASHBOARD_TOKENS.ink }}>{label}</Typography>
      {hint && (
        <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.2, mb: 1.4 }}>
          {hint}
        </Typography>
      )}
      {!hint && <Box sx={{ height: 12 }} />}
      {children}
    </Box>
  )
}

/** Două coloane pe desktop, una pe telefon. */
function Grid2({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>{children}</Box>
  )
}

function messageOf(cause: unknown, fallback: string): string {
  const data = (cause as { response?: { data?: { detail?: string; title?: string } } })?.response?.data
  return data?.detail ?? data?.title ?? fallback
}

export default CarEditDialog
