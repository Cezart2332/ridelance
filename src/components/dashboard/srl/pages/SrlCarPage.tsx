import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, IconButton, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'

import { SRL_PATHS } from '../../../../config/srlNavigation'
import { carsService, type Car } from '../../../../services/cars.service'
import { documentService, type CarDossier, type CarDossierSlot } from '../../../../services/document.service'
import { openDocument } from '../../../common/documentViewerBus'
import { checksService, type VehicleEvent } from '../../../../services/checks.service'
import { maintenanceService, type MaintenanceEntry } from '../../../../services/maintenance.service'
import { rentalsService, type Rental } from '../../../../services/rentals.service'
import { formatCarStatus } from '../../../../utils/carLabels'
import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, StatCard, StatusChip } from '../../ui'
import { CarEditDialog } from '../CarEditDialog'
import { MaintenanceEntryDialog } from '../MaintenanceEntryDialog'
import { NewRentalDialog } from '../NewRentalDialog'
import { RentalChecksPanel } from '../RentalChecksPanel'
import { RentalDocumentsPanel } from '../RentalDocumentsPanel'
import { RentalPaymentsPanel } from '../RentalPaymentsPanel'

/**
 * Pagina unei mașini din flotă — locul din care pornesc operațiunile pe ea.
 *
 * Până acum flota avea o listă de mașini și liste separate de închirieri și de mentenanță, fără
 * niciun ecran care să le adune pe una singură. Ca să afli ce s-a întâmplat cu o mașină trebuia să
 * treci prin trei pagini și să filtrezi din ochi.
 *
 * Acum e și singurul loc în care se **fac** lucrurile: închirierea se deschide de aici, documentele
 * ei se generează de aici, intervențiile de service se înregistrează de aici. Paginile de
 * închirieri și de mentenanță au rămas ce erau de fapt — istoricul flotei, la nivel de flotă.
 *
 * Cele cinci taburi din spec §13, toate cu date: prezentare, închirieri, documente, mentenanță și
 * istoric.
 */

type TabId = 'prezentare' | 'inchirieri' | 'documente' | 'mentenanta' | 'istoric'

const TABS: { id: TabId; label: string }[] = [
  { id: 'prezentare', label: 'Prezentare' },
  { id: 'inchirieri', label: 'Închirieri' },
  { id: 'documente', label: 'Documente' },
  { id: 'mentenanta', label: 'Mentenanță' },
  { id: 'istoric', label: 'Istoric' },
]

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('ro-RO')

const formatKm = (km: number | null | undefined): string =>
  km == null ? '—' : `${km.toLocaleString('ro-RO')} km`

export function SrlCarPage() {
  const { carId = '' } = useParams()

  const [car, setCar] = useState<Car | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceEntry[]>([])
  const [dossier, setDossier] = useState<CarDossier | null>(null)
  const [timeline, setTimeline] = useState<VehicleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('prezentare')
  const [reloadToken, setReloadToken] = useState(0)

  const [editing, setEditing] = useState(false)
  const [renting, setRenting] = useState(false)
  const [addingMaintenance, setAddingMaintenance] = useState(false)
  /** Închirierea al cărei set de documente e deschis. */
  const [documentsFor, setDocumentsFor] = useState<Rental | null>(null)

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      carsService.getById(carId),
      rentalsService.getOverview(),
      maintenanceService.getOverview(carId),
      documentService.getCarDossier(carId),
      checksService.getTimeline(carId),
    ])
      .then(([loadedCar, overview, maintenanceOverview, carDossier, events]) => {
        if (cancelled) return
        setCar(loadedCar)
        // Închirierile vin întregi și se filtrează aici: o flotă are zeci, nu zeci de mii, iar un
        // parametru nou pe endpoint ar fi fost cod în plus pentru aceeași listă.
        setRentals(overview.rentals.filter((r) => r.carId === carId))
        setMaintenance(maintenanceOverview.entries)
        setDossier(carDossier)
        setTimeline(events)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca mașina.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [carId, reloadToken])

  const openRentals = useMemo(
    () => rentals.filter((r) => r.status !== 'completed' && r.status !== 'cancelled'),
    [rentals],
  )

  const closeRental = async (rental: Rental) => {
    try {
      await rentalsService.close(rental.id, null)
      reload()
    } catch {
      setError('Nu am putut încheia închirierea.')
    }
  }

  const removeMaintenance = async (id: string) => {
    try {
      await maintenanceService.remove(id)
      reload()
    } catch {
      setError('Nu am putut șterge intervenția.')
    }
  }

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={96} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    )
  }

  if (error && !car) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!car) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          Mașina nu a fost găsită.
        </Alert>
      </Box>
    )
  }

  const title = `${car.brand} ${car.model}, ${car.year}`
  // Antetul din spec §13: identitatea fizică a mașinii, nu cea de anunț. Ce lipsește se scrie ca
  // lipsă — o liniuță e mai utilă decât un câmp care dispare.
  const identity = [
    car.details?.plateNumber || '— fără număr',
    car.details?.vin ? `VIN ${car.details.vin}` : '— fără VIN',
    formatKm(car.details?.mileage),
  ].join(' · ')

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <Button
        component={RouterLink}
        to={SRL_PATHS.cars}
        startIcon={<ArrowBackRoundedIcon />}
        sx={{
          alignSelf: 'flex-start',
          textTransform: 'none',
          fontWeight: 700,
          color: DASHBOARD_TOKENS.textMuted,
        }}
      >
        Mașinile mele
      </Button>

      <PageHeader
        title={title}
        subtitle={identity}
        actions={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddRoundedIcon />}
              onClick={() => setRenting(true)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Închiriere nouă
            </Button>
            <Button
              startIcon={<EditRoundedIcon sx={{ fontSize: 17 }} />}
              onClick={() => setEditing(true)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Editează
            </Button>
            <Button
              component="a"
              href={`/masini/${car.slug}`}
              target="_blank"
              rel="noopener"
              endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Vezi anunțul
            </Button>
          </Stack>
        }
      />

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <StatCard label="Stare" value={formatCarStatus(car.status)} />
        <StatCard label="Închirieri deschise" value={String(openRentals.length)} />
        <StatCard
          label="Dosar vehicul"
          value={dossier ? `${dossier.completionPercent}%` : '—'}
        />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, next: TabId) => setTab(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: `1px solid ${DASHBOARD_TOKENS.border}` }}
      >
        {TABS.map((entry) => (
          <Tab
            key={entry.id}
            value={entry.id}
            label={entry.label}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          />
        ))}
      </Tabs>

      {tab === 'prezentare' && <PresentationTab car={car} />}

      {tab === 'inchirieri' && (
        <RentalsTab
          rentals={rentals}
          onNew={() => setRenting(true)}
          onDocuments={setDocumentsFor}
          onClose={(rental) => void closeRental(rental)}
        />
      )}

      {tab === 'mentenanta' && (
        <MaintenanceTab
          entries={maintenance}
          onAdd={() => setAddingMaintenance(true)}
          onDelete={(id) => void removeMaintenance(id)}
        />
      )}

      {tab === 'documente' && dossier && <DocumentsTab carId={carId} dossier={dossier} onUploaded={reload} />}

      {tab === 'istoric' && <TimelineTab events={timeline} />}

      <CarEditDialog
        open={editing}
        car={car}
        mode="owner"
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          reload()
        }}
      />

      <NewRentalDialog
        open={renting}
        cars={[car]}
        fixedCarId={car.id}
        onClose={() => setRenting(false)}
        onSaved={() => {
          setRenting(false)
          reload()
        }}
      />

      <MaintenanceEntryDialog
        open={addingMaintenance}
        cars={[car]}
        fixedCarId={car.id}
        onClose={() => setAddingMaintenance(false)}
        onSaved={() => {
          setAddingMaintenance(false)
          reload()
        }}
      />

      {/* Documentele se deschid peste pagina mașinii, nu într-un alt ecran: sunt un rezultat al
          închirierii, iar drumul înapoi la ea trebuie să fie un click. */}
      <Dialog open={documentsFor !== null} onClose={() => setDocumentsFor(null)} fullWidth maxWidth="sm">
        <DialogContent sx={{ p: 0 }}>
          {documentsFor && (
            <Stack spacing={2}>
              <RentalDocumentsPanel rental={documentsFor} />
              <RentalChecksPanel rental={documentsFor} />
              <RentalPaymentsPanel rental={documentsFor} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDocumentsFor(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Închide
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

/**
 * Dosarul mașinii: ce document se așteaptă, ce e încărcat și ce expiră.
 *
 * Sloturile sunt fixe, iar cele goale rămân vizibile. O listă doar cu ce s-a încărcat n-ar fi
 * spus niciodată ce lipsește — exact întrebarea la care trebuie să răspundă un dosar.
 */
function DocumentsTab({
  carId,
  dossier,
  onUploaded,
}: {
  carId: string
  dossier: CarDossier
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const pickFile = (category: string) => {
    setUploadingFor(category)
    inputRef.current?.click()
  }

  const onFile = async (file: File | undefined) => {
    if (!file || !uploadingFor) return
    setUploadError(null)
    try {
      await documentService.upload(file, uploadingFor, undefined, undefined, undefined, undefined, carId)
      onUploaded()
    } catch {
      setUploadError('Nu am putut încărca documentul.')
    } finally {
      setUploadingFor(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Panel
      title="Dosarul mașinii"
      subtitle={`${dossier.completionPercent}% complet. Documentele nu blochează publicarea anunțului.`}
    >
      {uploadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {uploadError}
        </Alert>
      )}

      <Box
        component="input"
        type="file"
        ref={inputRef}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => void onFile(event.target.files?.[0])}
        sx={{ display: 'none' }}
      />

      <Stack>
        {dossier.slots.map((slot, index) => (
          <DossierRow
            key={slot.category}
            slot={slot}
            first={index === 0}
            busy={uploadingFor === slot.category}
            onUpload={() => pickFile(slot.category)}
          />
        ))}
      </Stack>
    </Panel>
  )
}

const SLOT_STATE: Record<CarDossierSlot['state'], { label: string; tone: 'active' | 'neutral' | 'error' }> = {
  valid: { label: 'Valabil', tone: 'active' },
  expiring_soon: { label: 'Expiră curând', tone: 'error' },
  expired: { label: 'Expirat', tone: 'error' },
  missing: { label: 'Lipsește', tone: 'neutral' },
}

function DossierRow({
  slot,
  first,
  busy,
  onUpload,
}: {
  slot: CarDossierSlot
  first: boolean
  busy: boolean
  onUpload: () => void
}) {
  const state = SLOT_STATE[slot.state]

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        py: 1.4,
        borderTop: first ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
            {slot.label}
          </Typography>
          {!slot.required && (
            <Typography sx={{ fontSize: '0.72rem', color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700 }}>
              opțional
            </Typography>
          )}
        </Stack>
        <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }} noWrap>
          {slot.fileName ?? 'Neîncărcat'}
          {slot.expiresAtUtc ? ` · expiră ${formatDate(slot.expiresAtUtc)}` : ''}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
        <StatusChip tone={state.tone} label={state.label} />
        {slot.documentId && (
          <Button
            size="small"
            startIcon={<VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => openDocument(slot.documentId!, slot.fileName ?? slot.label)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Vezi
          </Button>
        )}
        <Button
          size="small"
          startIcon={<UploadRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={onUpload}
          disabled={busy}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {slot.documentId ? 'Înlocuiește' : 'Încarcă'}
        </Button>
      </Stack>
    </Stack>
  )
}

/**
 * Cronologia mașinii. Se scrie singură, din acțiunile sistemului (spec §10).
 *
 * Nu se poate adăuga nimic de mână: un istoric în care poate scrie cineva nu mai e istoric, e o
 * listă de afirmații.
 */
function TimelineTab({ events }: { events: VehicleEvent[] }) {
  if (events.length === 0) {
    return (
      <Panel title="Istoric">
        <Typography sx={{ fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
          Încă nu s-a întâmplat nimic cu mașina asta. Cronologia se completează singură, pe măsură
          ce se generează documente, se predă mașina sau se face o intervenție.
        </Typography>
      </Panel>
    )
  }

  return (
    <Panel title="Istoric" subtitle="Scris automat din acțiunile sistemului.">
      <Stack>
        {events.map((event, index) => (
          <Stack
            key={event.id}
            direction="row"
            spacing={2}
            sx={{
              py: 1.2,
              borderTop: index === 0 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: DASHBOARD_TOKENS.textSubtle,
                minWidth: 76,
                flexShrink: 0,
              }}
            >
              {formatDate(event.occurredAtUtc)}
            </Typography>
            <Typography sx={{ fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink }}>
              {event.description}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Panel>
  )
}

/** Datele mașinii, despărțite în ce ține de vehicul și ce ține de anunț. */
function PresentationTab({ car }: { car: Car }) {
  const vehicle: [string, string][] = [
    ['Motorizare', car.engine || '—'],
    ['Transmisie', car.transmission || '—'],
    ['Culoare', car.details?.color || '—'],
    ['Număr locuri', car.details?.seats ? String(car.details.seats) : '—'],
    ['Număr înmatriculare', car.details?.plateNumber || '—'],
    ['VIN', car.details?.vin || '—'],
    ['Kilometraj', formatKm(car.details?.mileage)],
    [
      'Prima înmatriculare',
      car.details?.firstRegistrationAtUtc ? formatDate(car.details.firstRegistrationAtUtc) : '—',
    ],
  ]

  const listing: [string, string][] = [
    ['Oraș', car.location || '—'],
    ['Zonă', car.details?.zone || '—'],
    ['Perioadă minimă', car.details?.minimumPeriod || '—'],
    ['Categorii', [...car.uberCategories, ...car.boltCategories].join(', ') || '—'],
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
      <Panel title="Vehiculul" subtitle="Ce ține de mașină, indiferent dacă e listată sau nu.">
        <DefinitionList rows={vehicle} />
      </Panel>

      <Stack spacing={2.5}>
        <Panel title="Anunțul" subtitle="Ce vede cineva în marketplace.">
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <StatusChip tone={car.active ? 'active' : 'neutral'} label={car.active ? 'Publicat' : 'Nepublicat'} />
          </Stack>
          <Stack direction="row" spacing={0.8} sx={{ alignItems: 'baseline', mb: 1.5 }}>
            <Amount value={car.pricePerWeek} size="card" />
            <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>lei / săptămână</Typography>
          </Stack>
          <DefinitionList rows={listing} />
        </Panel>
      </Stack>
    </Box>
  )
}

function DefinitionList({ rows }: { rows: [string, string][] }) {
  return (
    <Stack>
      {rows.map(([label, value], index) => (
        <Stack
          key={label}
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 2,
            py: 1,
            borderTop: index === 0 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>{label}</Typography>
          <Typography
            sx={{ fontSize: '0.88rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, textAlign: 'right' }}
          >
            {value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}

/**
 * Închirierile mașinii, cu ce se poate face pe fiecare.
 *
 * Butoanele astea stăteau în pagina de închirieri a flotei. Acolo trebuia întâi găsit rândul
 * potrivit printre toate contractele; aici sunt deja pe mașina în cauză.
 */
function RentalsTab({
  rentals,
  onNew,
  onDocuments,
  onClose,
}: {
  rentals: Rental[]
  onNew: () => void
  onDocuments: (rental: Rental) => void
  onClose: (rental: Rental) => void
}) {
  const action = (
    <Button
      size="small"
      startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
      onClick={onNew}
      sx={{ textTransform: 'none', fontWeight: 700 }}
    >
      Închiriere nouă
    </Button>
  )

  if (rentals.length === 0) {
    return (
      <Panel title="Închirieri" action={action}>
        <Typography sx={{ fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
          Mașina n-a fost încă închiriată.
        </Typography>
      </Panel>
    )
  }

  return (
    <Panel title="Închirieri" subtitle="Toate contractele mașinii, de la cel mai recent." action={action}>
      <Box sx={responsiveTableContainerSx}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <Box component="thead">
            <Box component="tr">
              {['Cod', 'Chiriaș', 'Perioadă', 'Chirie', 'Status', ''].map((header, index) => (
                <Box key={header || index} component="th" sx={headSx}>
                  {header}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {rentals.map((rental) => (
              <Box component="tr" key={rental.id}>
                <Box component="td" sx={{ ...cellSx, fontWeight: 700 }}>
                  {rental.publicCode}
                </Box>
                <Box component="td" sx={cellSx}>
                  {rental.tenant.name}
                </Box>
                <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem' }}>
                  {formatDate(rental.startAtUtc)} – {formatDate(rental.endAtUtc)}
                </Box>
                <Box component="td" sx={cellSx}>
                  <Amount value={rental.weeklyRentBani / 100} size="row" />
                </Box>
                <Box component="td" sx={cellSx}>
                  <StatusChip
                    tone={rental.status === 'active' ? 'active' : 'neutral'}
                    label={rental.status === 'active' ? 'Activă' : 'Încheiată'}
                  />
                </Box>
                <Box component="td" sx={{ ...cellSx, textAlign: 'right' }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      onClick={() => onDocuments(rental)}
                      sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Documente
                    </Button>
                    {rental.status !== 'completed' && rental.status !== 'cancelled' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onClose(rental)}
                        sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        Încheie
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Panel>
  )
}

function MaintenanceTab({
  entries,
  onAdd,
  onDelete,
}: {
  entries: MaintenanceEntry[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const action = (
    <Button
      size="small"
      startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
      onClick={onAdd}
      sx={{ textTransform: 'none', fontWeight: 700 }}
    >
      Adaugă intervenție
    </Button>
  )

  if (entries.length === 0) {
    return (
      <Panel title="Mentenanță" action={action}>
        <Typography sx={{ fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
          Nicio intervenție înregistrată pentru mașina asta.
        </Typography>
      </Panel>
    )
  }

  return (
    <Panel title="Mentenanță" subtitle="Intervenții și programări, de la cea mai recentă." action={action}>
      <Stack spacing={1.5}>
        {entries.map((entry) => (
          <Stack
            key={entry.id}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              justifyContent: 'space-between',
              alignItems: { sm: 'center' },
              py: 1.2,
              borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
                {entry.title}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
                {formatDate(entry.performedAtUtc)}
                {entry.mileage != null ? ` · ${formatKm(entry.mileage)}` : ''}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Amount value={entry.costBani / 100} size="row" />
              <IconButton
                size="small"
                aria-label={`Șterge intervenția ${entry.title}`}
                onClick={() => onDelete(entry.id)}
                sx={{ color: DASHBOARD_TOKENS.textMuted, '&:hover': { color: DASHBOARD_TOKENS.stateError } }}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Panel>
  )
}

const headSx = {
  textAlign: 'left',
  py: 1,
  px: 1.2,
  fontSize: '0.74rem',
  fontWeight: 800,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  color: DASHBOARD_TOKENS.textSubtle,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
} as const

const cellSx = {
  py: 1.2,
  px: 1.2,
  fontSize: '0.86rem',
  color: DASHBOARD_TOKENS.ink,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
} as const
