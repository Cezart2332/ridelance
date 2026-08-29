import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import type { Car } from '../../../services/cars.service'
import {
  RENTAL_ACCESSORIES,
  rentalsService,
  type RentalDefaults,
  type Tenant,
  type TenantType,
} from '../../../services/rentals.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { DateField } from '../../common/DateField'

/**
 * Închirierea nouă, ca dialog.
 *
 * Stătea în pagina de închirieri, care e acum doar istoric: o închiriere se deschide de pe mașina
 * care se dă, nu dintr-o listă de contracte. De aceea primește `fixedCarId` — când se pornește din
 * pagina unei mașini, selectorul de mașină nici nu se mai arată.
 *
 * Chiriașii și valorile firmei se încarcă singure, la deschidere: fiecare loc din care se poate
 * porni o închiriere ar fi trebuit altfel să le ceară separat, iar unul dintre ele ar fi uitat.
 */

const TENANT_TYPES: { value: TenantType; label: string }[] = [
  { value: 'Individual', label: 'Persoană fizică' },
  { value: 'Pfa', label: 'PFA' },
  { value: 'Srl', label: 'SRL' },
]

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Perioada implicită propusă la o închiriere nouă — două luni, minimul obișnuit din flote. */
const DEFAULT_PERIOD_DAYS = 60

export interface NewRentalDialogProps {
  open: boolean
  cars: Car[]
  /** Mașina, când dialogul se deschide de pe ea. Fără ea, se alege din listă. */
  fixedCarId?: string
  onClose: () => void
  onSaved: () => void
}

export function NewRentalDialog({ open, cars, fixedCarId, onClose, onSaved }: NewRentalDialogProps) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [defaults, setDefaults] = useState<RentalDefaults | null>(null)
  const [pickedCarId, setPickedCarId] = useState<string | null>(null)
  /** `''` înseamnă „chiriaș nou". Un chiriaș existent nu se mai retastează. */
  const [tenantId, setTenantId] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantType, setTenantType] = useState<TenantType>('Individual')
  const [fiscalCode, setFiscalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otherCosts, setOtherCosts] = useState('')
  const [hasKmLimit, setHasKmLimit] = useState(false)
  const [mileageLimit, setMileageLimit] = useState('')
  const [extraKmCost, setExtraKmCost] = useState('')
  const [fuelRule, setFuelRule] = useState('')
  const [fuelLevel, setFuelLevel] = useState('')
  const [accessories, setAccessories] = useState<string[]>([])
  const [accessoriesOther, setAccessoriesOther] = useState('')
  // Inițializatoare leneșe: citirea ceasului e impură, deci nu are ce căuta în corpul randării.
  const [start, setStart] = useState(() => isoDate(new Date()))
  const [end, setEnd] = useState(() => isoDate(new Date(Date.now() + DEFAULT_PERIOD_DAYS * 86_400_000)))
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [mileage, setMileage] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    Promise.all([rentalsService.getTenants(), rentalsService.getDefaults()])
      .then(([myTenants, myDefaults]) => {
        if (cancelled) return
        setTenants(myTenants)
        setDefaults(myDefaults)
      })
      // Lipsa lor nu blochează: formularul rămâne gol, iar omul îl completează de mână.
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [open])

  const carId = fixedCarId ?? pickedCarId ?? cars[0]?.id ?? ''
  const selectedCar = cars.find((c) => c.id === carId)

  /**
   * Ordinea de precompletare: ce a tastat omul, apoi valorile firmei, apoi prețul anunțului.
   * Firma bate anunțul pentru că e o decizie luată o dată pentru toate mașinile; anunțul e ultimul
   * refugiu, pentru flotele care n-au apucat să-și seteze nimic.
   *
   * Nimic din ce se vede aici nu se întoarce în setările firmei — precompletează, nu leagă.
   */
  const rentValue =
    rent || (defaults?.weeklyRentBani != null ? String(defaults.weeklyRentBani / 100) : '')
    || (selectedCar ? String(selectedCar.pricePerWeek) : '')
  const depositValue = deposit || (defaults?.depositBani != null ? String(defaults.depositBani / 100) : '')
  const extraKmValue =
    extraKmCost || (defaults?.extraKmCostBani != null ? String(defaults.extraKmCostBani / 100) : '')
  const mileageLimitValue = mileageLimit || (defaults?.mileageLimit != null ? String(defaults.mileageLimit) : '')
  const fuelRuleValue = fuelRule || defaults?.fuelRule || ''
  const kmLimitChecked = hasKmLimit || (defaults?.hasKmLimit ?? false)

  const save = async () => {
    if (!carId) {
      setError('Alege mașina.')
      return
    }

    if (!tenantId && !tenantName.trim()) {
      setError('Alege un chiriaș sau scrie numele unuia nou.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await rentalsService.create({
        carId,
        tenantId: tenantId || null,
        // Datele chiriașului pleacă doar când e unul nou. Pentru unul existent, serverul le are —
        // retrimiterea lor ar fi însemnat că formularul poate rescrie tăcut un chiriaș.
        tenant: tenantId
          ? null
          : {
              name: tenantName.trim(),
              type: tenantType,
              cnp: tenantType === 'Individual' ? fiscalCode.trim() || null : null,
              cui: tenantType === 'Individual' ? null : fiscalCode.trim() || null,
              idSeries: null,
              idNumber: null,
              regCom: null,
              address: null,
              phone: phone.trim() || null,
              email: email.trim() || null,
              driverLicenseNumber: null,
            },
        startAtUtc: new Date(`${start}T12:00:00Z`).toISOString(),
        endAtUtc: new Date(`${end}T12:00:00Z`).toISOString(),
        weeklyRentBani: rentValue ? Math.round(Number(rentValue) * 100) : 0,
        depositBani: depositValue ? Math.round(Number(depositValue) * 100) : 0,
        otherCostsBani: otherCosts ? Math.round(Number(otherCosts) * 100) : 0,
        hasKmLimit: kmLimitChecked,
        mileageLimit: kmLimitChecked && mileageLimitValue ? Number(mileageLimitValue) : null,
        extraKmCostBani: extraKmValue ? Math.round(Number(extraKmValue) * 100) : 0,
        fuelRule: fuelRuleValue.trim() || null,
        fuelLevelAtPickup: fuelLevel.trim() || null,
        startMileage: mileage ? Number(mileage) : null,
        accessories,
        accessoriesOther: accessoriesOther.trim() || null,
        notes: notes.trim() || null,
      })
      setTenantId('')
      setTenantName('')
      setFiscalCode('')
      setPhone('')
      setEmail('')
      setRent('')
      setDeposit('')
      setOtherCosts('')
      setMileage('')
      setAccessories([])
      setAccessoriesOther('')
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
      <DialogTitle sx={{ fontWeight: 800 }}>
        Închiriere nouă
        {selectedCar && fixedCarId && (
          <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: DASHBOARD_TOKENS.textMuted, mt: 0.2 }}>
            {selectedCar.brand} {selectedCar.model}, {selectedCar.year}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}

          {/* Mașina fixată nu se mai alege: dialogul s-a deschis de pe ea. */}
          {!fixedCarId && (
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
          )}

          {tenants.length > 0 && (
            <TextField
              select
              label="Chiriaș"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
              helperText={tenantId ? 'Datele lui sunt deja la noi.' : 'Completează mai jos datele unui chiriaș nou.'}
            >
              <MenuItem value="">Chiriaș nou</MenuItem>
              {tenants.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                  {t.phone ? ` · ${t.phone}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Datele se cer o singură dată. Pentru un chiriaș ales, blocul dispare. */}
          <Box
            sx={{
              display: tenantId ? 'none' : 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
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
          </Box>

          {/* Termenii închirierii. Grilă separată de datele chiriașului: pe aceea o ascundem când
              s-a ales un chiriaș existent, iar perioada și prețul trebuie completate oricum. */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
              helperText={defaults?.weeklyRentBani != null ? 'Din valorile firmei.' : 'Din prețul anunțului.'}
            />
            <TextField
              label="Garanție (lei)"
              type="number"
              value={depositValue}
              onChange={(e) => setDeposit(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Alte costuri (lei)"
              type="number"
              value={otherCosts}
              onChange={(e) => setOtherCosts(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Nivel combustibil la preluare"
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
              placeholder="plin, 3/4, 80%"
            />
            <TextField
              label="Regulă de retur"
              value={fuelRuleValue}
              onChange={(e) => setFuelRule(e.target.value)}
              fullWidth
              size="small"
              sx={{ ...dashboardInputSx, gridColumn: { xs: 'auto', sm: '1 / -1' } }}
              placeholder="plin → plin"
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

          {/* Limita de km și numărul ei stau împreună: „cu limită" fără cifră nu înseamnă nimic. */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={kmLimitChecked}
                  onChange={(e) => {
                    setHasKmLimit(e.target.checked)
                    if (!e.target.checked) setMileageLimit('')
                  }}
                />
              }
              label="Limită de kilometri"
              slotProps={{ typography: { sx: { fontSize: '0.88rem', fontWeight: 700 } } }}
            />
            {kmLimitChecked && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
                <TextField
                  label="Km incluși"
                  type="number"
                  value={mileageLimitValue}
                  onChange={(e) => setMileageLimit(e.target.value)}
                  fullWidth
                  size="small"
                  sx={dashboardInputSx}
                />
                <TextField
                  label="Cost / km suplimentar (lei)"
                  type="number"
                  value={extraKmValue}
                  onChange={(e) => setExtraKmCost(e.target.value)}
                  fullWidth
                  size="small"
                  sx={dashboardInputSx}
                />
              </Box>
            )}
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink, mb: 0.5 }}>
              Accesorii predate
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.5 }}>
              {RENTAL_ACCESSORIES.map((item) => (
                <FormControlLabel
                  key={item}
                  control={
                    <Checkbox
                      size="small"
                      checked={accessories.includes(item)}
                      onChange={(e) =>
                        setAccessories(
                          e.target.checked
                            // Ordinea din catalog, nu ordinea bifării: două procese-verbale cu
                            // aceleași accesorii trebuie să le enumere la fel.
                            ? RENTAL_ACCESSORIES.filter((a) => a === item || accessories.includes(a))
                            : accessories.filter((a) => a !== item),
                        )
                      }
                    />
                  }
                  label={item}
                  slotProps={{ typography: { sx: { fontSize: '0.84rem' } } }}
                />
              ))}
            </Box>
            <TextField
              label="Altele"
              value={accessoriesOther}
              onChange={(e) => setAccessoriesOther(e.target.value)}
              fullWidth
              size="small"
              sx={{ ...dashboardInputSx, mt: 1 }}
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

export default NewRentalDialog
