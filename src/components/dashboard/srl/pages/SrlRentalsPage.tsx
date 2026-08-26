import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'

import { carsService, type Car } from '../../../../services/cars.service'
import {
  rentalsService,
  type Rental,
  type RentalOverview,
  type RentalStatus,
  type TenantType,
} from '../../../../services/rentals.service'
import { DASHBOARD_TOKENS, dashboardInputSx, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, StatCard, StatusChip } from '../../ui'
import type { StatusTone } from '../../ui'
import { DateField } from '../../../common/DateField'

/**
 * Închirierile flotei: cine are ce mașină, până când și pe ce bani.
 *
 * Valorile contractuale se completează din setările firmei doar ca punct de plecare — odată
 * salvate, trăiesc pe închiriere. O modificare ulterioară a tarifului standard nu are voie să
 * rescrie retroactiv ce s-a convenit.
 */

const STATUS_PRESENTATION: Record<RentalStatus, { label: string; tone: StatusTone }> = {
  upcoming: { label: 'Viitoare', tone: 'neutral' },
  active: { label: 'Activă', tone: 'active' },
  ending_soon: { label: 'Se apropie predarea', tone: 'warning' },
  completed: { label: 'Încheiată', tone: 'neutral' },
}

const TABS = [
  { id: 'open', label: 'Active' },
  { id: 'upcoming', label: 'Viitoare' },
  { id: 'completed', label: 'Încheiate' },
] as const

type TabId = (typeof TABS)[number]['id']

const TENANT_TYPES: { value: TenantType; label: string }[] = [
  { value: 'Individual', label: 'Persoană fizică' },
  { value: 'Pfa', label: 'PFA' },
  { value: 'Srl', label: 'SRL' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Perioada implicită propusă la o închiriere nouă — două luni, minimul obișnuit din flote. */
const DEFAULT_PERIOD_DAYS = 60

function matchesTab(rental: Rental, tab: TabId): boolean {
  if (tab === 'upcoming') return rental.status === 'upcoming'
  if (tab === 'completed') return rental.status === 'completed'
  return rental.status === 'active' || rental.status === 'ending_soon'
}

export function SrlRentalsPage() {
  const [overview, setOverview] = useState<RentalOverview | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('open')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false

    Promise.all([rentalsService.getOverview(), carsService.getMyCars()])
      .then(([data, myCars]) => {
        if (cancelled) return
        setOverview(data)
        setCars(myCars)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca închirierile.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const close = async (rental: Rental) => {
    try {
      await rentalsService.close(rental.id, null)
      reload()
    } catch {
      setError('Nu am putut încheia închirierea.')
    }
  }

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={280} />
      </Stack>
    )
  }

  if (error && !overview) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  const summary = overview?.summary
  const visible = (overview?.rentals ?? []).filter((r) => matchesTab(r, tab))

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Închirieri"
        subtitle="Cine are ce mașină, până când și în ce condiții."
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddRoundedIcon />}
            disabled={cars.length === 0}
            onClick={() => setDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Închiriere nouă
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <StatCard label="Închirieri active" value={String(summary.activeCount)} variant="accent" />
          <Panel dense>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
              Valoare contractuală
            </Typography>
            <Box sx={{ mt: 0.8 }}>
              <Amount value={summary.monthlyContractValueBani / 100} unit="lei" size="card" decimals={0} />
            </Box>
            <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.6 }}>
              pe lună, din contractele deschise
            </Typography>
          </Panel>
          <StatCard
            label="Predări apropiate"
            value={String(summary.upcomingHandoverCount)}
            helper="în următoarele 7 zile"
          />
          <StatCard label="Mașini libere" value={String(summary.availableCars)} />
        </Box>
      )}

      <Panel
        title="Toate închirierile"
        action={
          <Tabs
            value={tab}
            onChange={(_, value: TabId) => setTab(value)}
            sx={{
              minHeight: 0,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                minHeight: 36,
                color: DASHBOARD_TOKENS.textMuted,
                '&.Mui-selected': { color: DASHBOARD_TOKENS.primaryStrong },
              },
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={t.label} />
            ))}
          </Tabs>
        }
      >
        {visible.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 2 }}>
            {cars.length === 0
              ? 'Adaugă întâi o mașină în flotă — o închiriere se face pe o mașină.'
              : 'Nicio închiriere în această categorie.'}
          </Typography>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <Box component="thead">
                <Box component="tr">
                  {['Mașină', 'Chiriaș', 'Perioadă', 'Chirie', 'Garanție', 'Status', ''].map((h, i) => (
                    <Box component="th" key={h || i} sx={headSx}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {visible.map((rental) => (
                  <Box component="tr" key={rental.id}>
                    <Box component="td" sx={cellSx}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.86rem', color: DASHBOARD_TOKENS.ink }}>
                        {rental.carLabel}
                      </Typography>
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{rental.tenantName}</Typography>
                      {rental.tenantPhone && (
                        <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textMuted }}>
                          {rental.tenantPhone}
                        </Typography>
                      )}
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.8rem' }}>
                      {formatDate(rental.startAtUtc)} – {formatDate(rental.endAtUtc)}
                      {rental.closedAtUtc && (
                        <Typography sx={{ fontSize: '0.74rem', color: DASHBOARD_TOKENS.textMuted }}>
                          predată {formatDate(rental.closedAtUtc)}
                        </Typography>
                      )}
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Amount value={rental.weeklyRentBani / 100} unit="lei/săpt." size="row" decimals={0} />
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Amount value={rental.depositBani / 100} unit="lei" size="row" decimals={0} />
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <StatusChip
                        label={STATUS_PRESENTATION[rental.status].label}
                        tone={STATUS_PRESENTATION[rental.status].tone}
                        size="sm"
                        outlined
                      />
                    </Box>
                    <Box component="td" sx={{ ...cellSx, textAlign: 'right' }}>
                      {rental.status !== 'completed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => void close(rental)}
                          sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                        >
                          Încheie
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Panel>

      <NewRentalDialog
        open={dialogOpen}
        cars={cars}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false)
          reload()
        }}
      />
    </Stack>
  )
}

function NewRentalDialog({
  open,
  cars,
  onClose,
  onSaved,
}: {
  open: boolean
  cars: Car[]
  onClose: () => void
  onSaved: () => void
}) {
  const [pickedCarId, setPickedCarId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState('')
  const [tenantType, setTenantType] = useState<TenantType>('Individual')
  const [fiscalCode, setFiscalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  // Inițializatoare leneșe: citirea ceasului e impură, deci nu are ce căuta în corpul randării.
  const [start, setStart] = useState(() => isoDate(new Date()))
  const [end, setEnd] = useState(() => isoDate(new Date(Date.now() + DEFAULT_PERIOD_DAYS * 86_400_000)))
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [mileage, setMileage] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carId = pickedCarId ?? cars[0]?.id ?? ''
  // Prețul mașinii e punctul de plecare al chiriei — cel mai des e chiar el.
  const selectedCar = cars.find((c) => c.id === carId)
  const rentValue = rent || (selectedCar ? String(selectedCar.pricePerWeek) : '')

  const save = async () => {
    if (!carId || !tenantName.trim()) {
      setError('Alege mașina și scrie numele chiriașului.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await rentalsService.create({
        carId,
        tenantName: tenantName.trim(),
        tenantType,
        tenantFiscalCode: fiscalCode.trim() || null,
        tenantPhone: phone.trim() || null,
        tenantEmail: email.trim() || null,
        startAtUtc: new Date(`${start}T12:00:00Z`).toISOString(),
        endAtUtc: new Date(`${end}T12:00:00Z`).toISOString(),
        weeklyRentBani: rentValue ? Math.round(Number(rentValue) * 100) : 0,
        depositBani: deposit ? Math.round(Number(deposit) * 100) : 0,
        hasKmLimit: false,
        extraKmCostBani: 0,
        fuelRule: null,
        startMileage: mileage ? Number(mileage) : null,
        accessories: null,
        notes: notes.trim() || null,
      })
      setTenantName('')
      setFiscalCode('')
      setPhone('')
      setEmail('')
      setRent('')
      setDeposit('')
      setMileage('')
      setNotes('')
      onSaved()
    } catch (err) {
      // Suprapunerea de perioade e cea mai probabilă respingere; mesajul serverului o explică.
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(message ?? 'Nu am putut salva închirierea.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Închiriere nouă</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}

          <TextField
            select
            label="Mașină"
            value={carId}
            onChange={(e) => setPickedCarId(e.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {cars.map((car) => (
              <MenuItem key={car.id} value={car.id}>
                {car.brand} {car.model}, {car.year}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Tip chiriaș"
              value={tenantType}
              onChange={(e) => setTenantType(e.target.value as TenantType)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            >
              {TENANT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nume complet"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label={tenantType === 'Individual' ? 'CNP' : 'CUI'}
              value={fiscalCode}
              onChange={(e) => setFiscalCode(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              sx={{ ...dashboardInputSx, gridColumn: { xs: 'auto', sm: '1 / -1' } }}
            />
            <DateField
              label="Preluare"
              value={start}
              onChange={setStart}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <DateField
              label="Predare estimată"
              value={end}
              onChange={setEnd}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Chirie / săptămână (lei)"
              type="number"
              value={rentValue}
              onChange={(e) => setRent(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
              helperText="Precompletată din prețul anunțului."
            />
            <TextField
              label="Garanție (lei)"
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Kilometraj la preluare"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              fullWidth
              size="small"
              sx={{ ...dashboardInputSx, gridColumn: { xs: 'auto', sm: '1 / -1' } }}
            />
          </Box>

          <TextField
            label="Observații"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            sx={dashboardInputSx}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
          Renunță
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={saving}
          onClick={() => void save()}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
        >
          {saving ? 'Se salvează…' : 'Salvează'}
        </Button>
      </DialogActions>
    </Dialog>
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
