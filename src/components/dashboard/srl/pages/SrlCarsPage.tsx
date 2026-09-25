import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { SRL_PATHS, srlCarPath } from '../../../../config/srlNavigation'
import { withIntent } from '../../../../config/dashboardNav'
import { useQuickActionIntent } from '../../layout/useQuickActionIntent'
import { carsService, type Car, type CarLead } from '../../../../services/cars.service'
import { rentalsService, type Rental, type RentalDocumentType } from '../../../../services/rentals.service'
import { DASHBOARD_TOKENS, dashboardInputSx, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, pillToggleSx, StatCard, StatGrid, StatusChip } from '../../ui'
import { CarDocumentsDialog } from '../CarDocumentsDialog'
import { CarEditDialog } from '../CarEditDialog'
import { FleetCarCard } from '../FleetCarCard'
import { ListingQuotaCard } from '../ListingQuotaCard'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { NewRentalDialog } from '../NewRentalDialog'
import { PublishCarDialog } from '../PublishCarDialog'

/**
 * Flota, ca punct de plecare al operațiunilor.
 *
 * Pagina folosea ecranul de administrare a anunțurilor — același tabel pe care îl vede adminul
 * RIDElance peste toate mașinile din piață. Bun la moderat anunțuri, nepotrivit pentru cineva
 * care își ține flota: acolo întrebarea nu e „ce anunțuri am", ci „ce fac cu mașina asta acum".
 *
 * De aceea fiecare mașină e un card cu patru acțiuni scrise pe el, iar închirierile și service-ul
 * nu se mai deschid din pagini separate: se pornesc de aici sau din dosarul mașinii.
 */

type TabId = 'masini' | 'solicitari' | 'statistici'

const TABS: { id: TabId; label: string }[] = [
  { id: 'masini', label: 'Mașini' },
  { id: 'solicitari', label: 'Solicitări' },
  { id: 'statistici', label: 'Statistici' },
]

type FilterId = 'toate' | 'inchiriate' | 'libere' | 'nepublicate'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'toate', label: 'Toate' },
  { id: 'inchiriate', label: 'Închiriate' },
  { id: 'libere', label: 'Libere' },
  { id: 'nepublicate', label: 'Nepublicate' },
]

const LEAD_STATUSES = ['Nou', 'Contactat', 'În discuție', 'Acceptat', 'Respins']

const LEAD_STATUS_TO_API: Record<string, string> = {
  Nou: 'New',
  Contactat: 'Contacted',
  'În discuție': 'InDiscussion',
  Acceptat: 'Accepted',
  Respins: 'Rejected',
}

/** O închiriere ține mașina cât timp nu s-a încheiat și nu s-a anulat. */
const holdsCar = (rental: Rental): boolean => rental.status !== 'completed' && rental.status !== 'cancelled'

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('ro-RO')

/** Ce document cere fiecare acțiune rapidă. Procesele-verbale merg împreună: sunt aceeași operație, în două momente. */
const DOCUMENT_INTENTS = {
  contract: { title: 'Contract de închiriere', types: ['RentalContract'] as RentalDocumentType[] },
  protocol: {
    title: 'Proces-verbal de predare / primire',
    types: ['HandoverProtocol', 'ReturnProtocol'] as RentalDocumentType[],
  },
} as const

type DocumentIntent = keyof typeof DOCUMENT_INTENTS

export function SrlCarsPage() {
  const navigate = useNavigate()

  const [cars, setCars] = useState<Car[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [leads, setLeads] = useState<CarLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Câte anunțuri active include abonamentul. Cele folosite se numără din `cars`, ca să se schimbe odată cu ele. */
  const [includedListings, setIncludedListings] = useState<number | null>(null)

  const [tab, setTab] = useState<TabId>('masini')
  const [filter, setFilter] = useState<FilterId>('toate')
  const [search, setSearch] = useState('')

  const [editing, setEditing] = useState<Car | null>(null)
  const [rentingCarId, setRentingCarId] = useState<string | null>(null)
  const [documentsFor, setDocumentsFor] = useState<{ carId: string; intent: DocumentIntent } | null>(null)
  /** Mașina care se publică acum: dialogul întreabă de anunțul extra și de numărul ascuns. */
  const [publishingCarId, setPublishingCarId] = useState<string | null>(null)

  const [reloadToken, setReloadToken] = useState(0)
  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  /**
   * Ce a cerut meniul „+”. Nimic nu se copiază în stare: tab-ul, filtrul și dialogurile se derivă
   * din intenție cât timp ea e în adresă, iar orice alegere a omului o închide.
   */
  const { intent, clearIntent } = useQuickActionIntent()

  useEffect(() => {
    let cancelled = false

    Promise.all([
      carsService.getMyCars(),
      rentalsService.getOverview(),
      carsService.getLeads(),
      carsService.getListingQuota(),
    ])
      .then(([myCars, overview, myLeads, quota]) => {
        if (cancelled) return
        setCars(myCars)
        setRentals(overview.rentals)
        setLeads(myLeads)
        setIncludedListings(quota.included)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca flota.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  /** Închirierea care ține fiecare mașină acum. Una singură: perioadele nu se suprapun. */
  const currentRentals = useMemo(() => {
    const map = new Map<string, Rental>()
    for (const rental of rentals) {
      if (holdsCar(rental) && !map.has(rental.carId)) map.set(rental.carId, rental)
    }
    return map
  }, [rentals])

  // „Publică anunț” arată mașinile nepublicate, „Generează contract” pe cele închiriate — acolo
  // sunt butoanele care fac asta, pe fiecare mașină.
  const activeTab: TabId = intent === 'anunt' || intent === 'contract' ? 'masini' : tab
  const activeFilter: FilterId = intent === 'anunt' ? 'nepublicate' : intent === 'contract' ? 'inchiriate' : filter

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()

    return cars.filter((car) => {
      if (needle && !`${car.brand} ${car.model} ${car.details?.plateNumber ?? ''}`.toLowerCase().includes(needle)) {
        return false
      }
      if (activeFilter === 'inchiriate') return currentRentals.has(car.id)
      if (activeFilter === 'libere') return !currentRentals.has(car.id)
      if (activeFilter === 'nepublicate') return car.listingStatus !== 'Published' || !car.active
      return true
    })
  }, [cars, search, activeFilter, currentRentals])

  const togglePublish = async (id: string) => {
    // Publicarea trece prin dialog (anunț extra, număr ascuns); retragerea rămâne un click.
    const target = cars.find((car) => car.id === id)
    if (target && target.listingStatus !== 'Published') {
      setPublishingCarId(id)
      return
    }
    try {
      const next = await carsService.toggleActive(id)
      setCars((prev) => prev.map((car) => (car.id === id ? { ...car, ...next } : car)))
    } catch (err) {
      // Serverul spune de ce: de obicei, că s-au terminat anunțurile incluse în abonament.
      setError(getErrorMessage(err, 'Nu am putut schimba starea anunțului.'))
    }
  }

  const archive = async (id: string) => {
    if (!window.confirm('Scoți mașina din flotă? Anunțul dispare de pe piață, dar închirierile, dosarul și mentenanța rămân.')) {
      return
    }
    try {
      const next = await carsService.archive(id)
      setCars((prev) => prev.map((car) => (car.id === id ? { ...car, ...next } : car)))
    } catch {
      setError('Nu am putut scoate mașina din flotă.')
    }
  }

  const setLeadStatus = async (id: string, label: string) => {
    try {
      await carsService.updateLeadStatus(id, LEAD_STATUS_TO_API[label] ?? label)
      setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status: label } : lead)))
    } catch {
      setError('Nu am putut actualiza statusul solicitării.')
    }
  }

  const rentedCount = cars.filter((car) => currentRentals.has(car.id)).length
  const cancelExtra = async (id: string) => {
    if (!window.confirm('Oprești anunțul extra? Abonamentul de 40 lei pe lună se oprește, iar anunțul trece pe pauză dacă nu mai ai loc în cele incluse.')) return
    try {
      await carsService.cancelExtraListing(id)
      reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut opri anunțul extra.'))
    }
  }

  const publishedCount = cars.filter((car) => car.active).length
  // Aceeași regulă ca pe server (`ListingQuota`): un loc e ocupat de un anunț publicat.
  const usedListings = cars.filter((car) => car.listingStatus === 'Published').length
  const quota =
    includedListings === null
      ? null
      : { included: includedListings, used: usedListings, remaining: Math.max(0, includedListings - usedListings) }

  // Cu o singură mașină închiriată, „Generează contract” n-are ce întreba: deschide contractul ei.
  const onlyRentedCarId = currentRentals.size === 1 ? [...currentRentals.keys()][0] : null
  const activeDocuments =
    documentsFor ?? (intent === 'contract' && onlyRentedCarId ? { carId: onlyRentedCarId, intent: 'contract' as DocumentIntent } : null)
  const documentsCar = cars.find((car) => car.id === activeDocuments?.carId) ?? null
  const documentsIntent = activeDocuments ? DOCUMENT_INTENTS[activeDocuments.intent] : null
  const renting = rentingCarId !== null || intent === 'inchiriere'

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={340} />
          ))}
        </Box>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Mașinile mele"
        subtitle="Fiecare mașină cu ce se poate face pe ea: dosar, închiriere, contract, proces-verbal."
        actions={<AddCarButton />}
        // Pe telefon, „Adaugă mașină” e în meniul „+” din antet.
        actionsOnMobile={false}
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

      <StatGrid columns={4}>
        <StatCard label="Mașini în flotă" value={String(cars.length)} helper={`${publishedCount} vizibile în piață`} variant="accent" />
        <StatCard label="Închiriate acum" value={String(rentedCount)} helper={`${cars.length - rentedCount} libere`} />
        <StatCard label="Solicitări" value={String(leads.length)} helper={`${leads.filter((l) => l.status === 'Nou').length} necitite`} />
        {quota && <ListingQuotaCard quota={quota} />}
      </StatGrid>

      <Tabs
        value={activeTab}
        onChange={(_, next: TabId) => {
          setTab(next)
          clearIntent()
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 700,
            color: DASHBOARD_TOKENS.textMuted,
            '&.Mui-selected': { color: DASHBOARD_TOKENS.accent },
          },
        }}
      >
        {TABS.map((entry) => (
          <Tab key={entry.id} value={entry.id} label={entry.label} />
        ))}
      </Tabs>

      {activeTab === 'masini' && (
        <Stack spacing={2}>
          {intent === 'anunt' && (
            <Alert
              severity={quota && quota.remaining === 0 ? 'warning' : 'info'}
              onClose={clearIntent}
              sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}
            >
              {quota && quota.remaining === 0
                ? `Ai folosit toate cele ${quota.included} anunțuri incluse în abonament. Un anunț nou se publică după ce retragi unul dintre cele active sau după ce treci la un abonament cu mai multe anunțuri — nu publicăm nimic automat.`
                : `Alege mașina și apasă „Publică” pe cardul ei.${quota ? ` Mai ai ${quota.remaining} din ${quota.included} anunțuri incluse în abonament.` : ''}`}
            </Alert>
          )}
          {intent === 'contract' && !onlyRentedCarId && (
            <Alert
              severity="info"
              onClose={clearIntent}
              action={
                currentRentals.size === 0 ? (
                  <Button
                    size="small"
                    onClick={() => navigate(withIntent(SRL_PATHS.cars, 'inchiriere'), { replace: true })}
                    sx={{ textTransform: 'none', fontWeight: 750, whiteSpace: 'nowrap' }}
                  >
                    Înregistrează închiriere
                  </Button>
                ) : undefined
              }
              sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}
            >
              {currentRentals.size === 0
                ? 'Contractul se generează dintr-o închiriere, iar acum nicio mașină nu e închiriată.'
                : 'Alege mașina și apasă „Contract” pe cardul ei.'}
            </Alert>
          )}
          {cars.length > 0 && (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
            >
              <TextField
                placeholder="Caută după marcă, model sau număr"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ ...dashboardInputSx, maxWidth: { md: 340 }, width: '100%' }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ fontSize: 18, color: DASHBOARD_TOKENS.textSubtle }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <ToggleButtonGroup
                exclusive
                value={activeFilter}
                onChange={(_, value: FilterId | null) => {
                  if (!value) return
                  setFilter(value)
                  clearIntent()
                }}
                sx={pillToggleSx}
              >
                {FILTERS.map((entry) => (
                  <ToggleButton key={entry.id} value={entry.id}>
                    {entry.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          )}

          {cars.length === 0 ? (
            <EmptyFleet />
          ) : visible.length === 0 ? (
            <Panel>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 1.5 }}>
                Nicio mașină aici. Schimbă filtrul sau caută altceva.
              </Typography>
            </Panel>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 2,
                alignItems: 'stretch',
              }}
            >
              {visible.map((car) => (
                <FleetCarCard
                  key={car.id}
                  car={car}
                  rental={currentRentals.get(car.id) ?? null}
                  onOpen={() => navigate(srlCarPath(car.id))}
                  onNewRental={() => setRentingCarId(car.id)}
                  onContract={() => setDocumentsFor({ carId: car.id, intent: 'contract' })}
                  onProtocol={() => setDocumentsFor({ carId: car.id, intent: 'protocol' })}
                  onEdit={() => setEditing(car)}
                  onTogglePublish={() => void togglePublish(car.id)}
                  onCancelExtra={() => void cancelExtra(car.id)}
                  onArchive={() => void archive(car.id)}
                  noListingsLeft={quota?.remaining === 0}
                />
              ))}
            </Box>
          )}
        </Stack>
      )}

      {activeTab === 'solicitari' && <LeadsPanel leads={leads} onStatusChange={(id, status) => void setLeadStatus(id, status)} />}

      {activeTab === 'statistici' && <StatsPanel cars={cars} />}

      <CarEditDialog
        open={editing !== null}
        car={editing}
        mode="owner"
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          reload()
        }}
      />

      <PublishCarDialog
        car={cars.find((car) => car.id === publishingCarId) ?? null}
        quota={quota}
        onClose={() => setPublishingCarId(null)}
        onChanged={reload}
      />

      <NewRentalDialog
        open={renting}
        cars={cars}
        fixedCarId={rentingCarId ?? undefined}
        onClose={() => {
          setRentingCarId(null)
          clearIntent()
        }}
        onSaved={() => {
          setRentingCarId(null)
          clearIntent()
          reload()
        }}
      />

      {documentsCar && documentsIntent && (
        <CarDocumentsDialog
          open
          car={documentsCar}
          rentals={rentals.filter((rental) => rental.carId === documentsCar.id)}
          only={documentsIntent.types}
          title={documentsIntent.title}
          onClose={() => {
            setDocumentsFor(null)
            clearIntent()
          }}
          onNewRental={() => {
            const carId = documentsCar.id
            setDocumentsFor(null)
            clearIntent()
            setRentingCarId(carId)
          }}
        />
      )}
    </Stack>
  )
}

/**
 * Butonul de adăugare.
 *
 * Adăugarea unei mașini e singura acțiune de pe ecran care creează ceva; restul operează pe ce
 * există. De aceea e singurul buton plin din antet și singurul cu umbră.
 */
function AddCarButton() {
  return (
    <Button
      component={RouterLink}
      to={SRL_PATHS.addCar}
      variant="contained"
      disableElevation
      startIcon={<AddRoundedIcon />}
      sx={{
        textTransform: 'none',
        fontWeight: 800,
        fontSize: '0.9rem',
        px: 2.6,
        py: 1.05,
        color: '#fff',
        borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
        background: `linear-gradient(135deg, ${DASHBOARD_TOKENS.accent}, ${DASHBOARD_TOKENS.primaryStrong})`,
        boxShadow: `0 6px 18px ${alpha(DASHBOARD_TOKENS.accent, 0.26)}`,
        transition: 'box-shadow 160ms ease, transform 160ms ease',
        '&:hover': {
          boxShadow: `0 10px 24px ${alpha(DASHBOARD_TOKENS.accent, 0.34)}`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      Adaugă mașină
    </Button>
  )
}

/** Flota goală. Un singur drum înainte, scris mare. */
function EmptyFleet() {
  return (
    <Box
      sx={{
        py: 7,
        px: 3,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
        border: `1.5px dashed ${DASHBOARD_TOKENS.borderHover}`,
        bgcolor: DASHBOARD_TOKENS.paper,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: DASHBOARD_TOKENS.accentWash,
          color: DASHBOARD_TOKENS.accent,
          mb: 1.6,
        }}
      >
        <DirectionsCarFilledRoundedIcon sx={{ fontSize: 26 }} />
      </Box>
      <Typography sx={{ fontWeight: 850, fontSize: '1.05rem', color: DASHBOARD_TOKENS.ink }}>
        Nicio mașină în flotă
      </Typography>
      <Typography sx={{ fontSize: '0.88rem', color: DASHBOARD_TOKENS.textMuted, maxWidth: 420, mt: 0.6, mb: 2.2 }}>
        Adaugă prima mașină și de pe cardul ei poți deschide dosarul, face o închiriere și genera
        contractul și procesul-verbal.
      </Typography>
      <AddCarButton />
    </Box>
  )
}

/** Cererile primite pe anunțuri. Singura acțiune e statusul: restul discuției se poartă pe telefon. */
function LeadsPanel({
  leads,
  onStatusChange,
}: {
  leads: CarLead[]
  onStatusChange: (id: string, status: string) => void
}) {
  if (leads.length === 0) {
    return (
      <Panel title="Solicitări">
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 1.5 }}>
          Nicio solicitare încă. Apar aici imediat ce cineva e interesat de o mașină.
        </Typography>
      </Panel>
    )
  }

  return (
    <Panel title="Solicitări" subtitle="Cererile primite pe anunțurile tale, de la cea mai recentă.">
      <Box sx={responsiveTableContainerSx}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <Box component="thead">
            <Box component="tr">
              {['Client', 'Mașină', 'Data', 'Status'].map((header) => (
                <Box component="th" key={header} sx={headSx}>
                  {header}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {leads.map((lead) => (
              <Box component="tr" key={lead.id}>
                <Box component="td" sx={cellSx}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink }}>
                    {lead.userName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
                    {lead.userPhone} · {lead.userEmail}
                  </Typography>
                  {lead.message && (
                    <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.ink, fontStyle: 'italic', mt: 0.4 }}>
                      „{lead.message}”
                    </Typography>
                  )}
                </Box>
                <Box component="td" sx={cellSx}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.6 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{lead.carName}</Typography>
                    {/* Lista de așteptare e altă discuție decât o cerere obișnuită. */}
                    {lead.intent === 'Waitlist' && <StatusChip label="Listă de așteptare" tone="warning" size="sm" />}
                  </Stack>
                  <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
                    {[
                      lead.city,
                      lead.weeks ? `${lead.weeks} săpt.` : null,
                      lead.preferredStartDate ? `de la ${formatDate(lead.preferredStartDate)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>
                <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                  {formatDate(lead.createdAtUtc)}
                </Box>
                <Box component="td" sx={cellSx}>
                  <TextField
                    select
                    size="small"
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value)}
                    sx={{ ...dashboardInputSx, width: 150 }}
                  >
                    {LEAD_STATUSES.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Panel>
  )
}

/** Cât de bine merg anunțurile. Totalurile sus, apoi fiecare mașină pe rândul ei. */
function StatsPanel({ cars }: { cars: Car[] }) {
  const totals = cars.reduce(
    (acc, car) => ({
      views: acc.views + (car.stats?.views ?? 0),
      clicks: acc.clicks + (car.stats?.clicks ?? 0),
      forms: acc.forms + (car.stats?.forms ?? 0),
    }),
    { views: 0, clicks: 0, forms: 0 },
  )

  const conversion = totals.views > 0 ? Math.round((totals.forms / totals.views) * 1000) / 10 : 0

  return (
    <Stack spacing={2}>
      <StatGrid columns={4}>
        <StatCard label="Vizualizări" value={totals.views.toLocaleString('ro-RO')} />
        <StatCard label="Click-uri" value={totals.clicks.toLocaleString('ro-RO')} />
        <StatCard label="Cereri" value={totals.forms.toLocaleString('ro-RO')} />
        <StatCard label="Conversie" value={`${conversion}%`} helper="cereri din vizualizări" />
      </StatGrid>

      <Panel title="Pe mașini" subtitle="Cine atrage și cine nu.">
        {cars.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 1.5 }}>
            Nicio mașină publicată încă.
          </Typography>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <Box component="thead">
                <Box component="tr">
                  {['Mașină', 'Preț', 'Vizualizări', 'Click-uri', 'Cereri'].map((header) => (
                    <Box component="th" key={header} sx={headSx}>
                      {header}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {cars.map((car) => (
                  <Box component="tr" key={car.id}>
                    <Box component="td" sx={cellSx}>
                      <Typography
                        component={RouterLink}
                        to={srlCarPath(car.id)}
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          color: DASHBOARD_TOKENS.ink,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {car.brand} {car.model}
                      </Typography>
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Amount value={car.pricePerWeek} unit="lei/săpt." size="row" decimals={0} />
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.86rem' }}>
                      {(car.stats?.views ?? 0).toLocaleString('ro-RO')}
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.86rem' }}>
                      {(car.stats?.clicks ?? 0).toLocaleString('ro-RO')}
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.86rem' }}>
                      {(car.stats?.forms ?? 0).toLocaleString('ro-RO')}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Panel>
    </Stack>
  )
}

const headSx = {
  textAlign: 'left' as const,
  py: 1,
  px: 1.2,
  fontSize: '0.75rem',
  fontWeight: 700,
  color: DASHBOARD_TOKENS.textMuted,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
}

const cellSx = {
  py: 1.3,
  px: 1.2,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
  verticalAlign: 'top' as const,
}

export default SrlCarsPage
