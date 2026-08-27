import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'

import { SRL_PATHS } from '../../../../config/srlNavigation'
import { carsService, type Car } from '../../../../services/cars.service'
import { maintenanceService, type MaintenanceEntry } from '../../../../services/maintenance.service'
import { rentalsService, type Rental } from '../../../../services/rentals.service'
import { formatCarStatus } from '../../../../utils/carLabels'
import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, ComingSoon, PageHeader, Panel, StatCard, StatusChip } from '../../ui'

/**
 * Pagina unei mașini din flotă — locul din care pornesc operațiunile pe ea.
 *
 * Până acum flota avea o listă de mașini și liste separate de închirieri și de mentenanță, fără
 * niciun ecran care să le adune pe una singură. Ca să afli ce s-a întâmplat cu o mașină trebuia să
 * treci prin trei pagini și să filtrezi din ochi.
 *
 * Taburile sunt cele cinci din spec §13, chiar dacă două n-au încă de unde lua date: structura
 * paginii e o promisiune făcută o dată, nu una rescrisă la fiecare fază. Cele două goale spun ce
 * vor conține, prin `ComingSoon` — ruta e navigabilă, nu produce erori și nu inventează conținut.
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
  const navigate = useNavigate()

  const [car, setCar] = useState<Car | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('prezentare')

  useEffect(() => {
    let cancelled = false

    Promise.all([
      carsService.getById(carId),
      rentalsService.getOverview(),
      maintenanceService.getOverview(carId),
    ])
      .then(([loadedCar, overview, maintenanceOverview]) => {
        if (cancelled) return
        setCar(loadedCar)
        // Închirierile vin întregi și se filtrează aici: o flotă are zeci, nu zeci de mii, iar un
        // parametru nou pe endpoint ar fi fost cod în plus pentru aceeași listă.
        setRentals(overview.rentals.filter((r) => r.carId === carId))
        setMaintenance(maintenanceOverview.entries)
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
  }, [carId])

  const openRentals = useMemo(
    () => rentals.filter((r) => r.status !== 'completed' && r.status !== 'cancelled'),
    [rentals],
  )

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={96} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    )
  }

  if (error || !car) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error ?? 'Mașina nu a fost găsită.'}
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
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => navigate(SRL_PATHS.rentals)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              + Închiriere nouă
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <StatCard label="Stare" value={formatCarStatus(car.status)} />
        <StatCard label="Închirieri deschise" value={String(openRentals.length)} />
        <StatCard label="Intervenții înregistrate" value={String(maintenance.length)} />
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
      {tab === 'inchirieri' && <RentalsTab rentals={rentals} />}
      {tab === 'mentenanta' && <MaintenanceTab entries={maintenance} />}

      {tab === 'documente' && (
        <ComingSoon
          title="Documentele mașinii"
          description="Talonul, RCA, CASCO, ITP și copia conformă se vor încărca aici, pe mașină. Până atunci se încarcă din Documente societate."
          upcoming={['Încărcare per mașină', 'Alerte de expirare', 'Vizualizare fără descărcare']}
          icon={<DescriptionRoundedIcon />}
        />
      )}

      {tab === 'istoric' && (
        <ComingSoon
          title="Istoricul mașinii"
          description="Contracte semnate, predări, primiri și intervenții, în ordine, scrise automat din acțiunile sistemului."
          upcoming={['Cronologie completă', 'Kilometri parcurși per închiriere', 'Plăți înregistrate']}
          icon={<HistoryRoundedIcon />}
        />
      )}
    </Stack>
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

function RentalsTab({ rentals }: { rentals: Rental[] }) {
  if (rentals.length === 0) {
    return (
      <Panel title="Închirieri">
        <Typography sx={{ fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
          Mașina n-a fost încă închiriată.
        </Typography>
      </Panel>
    )
  }

  return (
    <Panel title="Închirieri" subtitle="Toate contractele mașinii, de la cel mai recent.">
      <Box sx={responsiveTableContainerSx}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead">
            <Box component="tr">
              {['Cod', 'Chiriaș', 'Perioadă', 'Chirie', 'Status'].map((header) => (
                <Box key={header} component="th" sx={headSx}>
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
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Panel>
  )
}

function MaintenanceTab({ entries }: { entries: MaintenanceEntry[] }) {
  if (entries.length === 0) {
    return (
      <Panel title="Mentenanță">
        <Typography sx={{ fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
          Nicio intervenție înregistrată pentru mașina asta.
        </Typography>
      </Panel>
    )
  }

  return (
    <Panel title="Mentenanță" subtitle="Intervenții și programări, de la cea mai recentă.">
      <Stack spacing={1.5}>
        {entries.map((entry) => (
          <Stack
            key={entry.id}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              justifyContent: 'space-between',
              alignItems: { sm: 'baseline' },
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
            <Amount value={entry.costBani / 100} size="row" />
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
