import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

import { carsService, type Car } from '../../../../services/cars.service'
import {
  maintenanceService,
  type MaintenanceEntry,
  type MaintenanceOverview,
} from '../../../../services/maintenance.service'
import { DASHBOARD_TOKENS, dashboardInputSx, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, StatCard, StatusChip } from '../../ui'

/**
 * Mentenanța flotei: istoric de service, costuri și remindere.
 *
 * Intervențiile viitoare și cele trecute stau în aceeași listă, ordonate descrescător, fiindcă
 * întrebarea reală a unui administrator de flotă e „ce urmează și ce s-a făcut" — două tabele
 * separate ar fi rupt firul exact acolo unde e util să fie continuu.
 */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SrlMaintenancePage() {
  const [overview, setOverview] = useState<MaintenanceOverview | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [reloadToken, setReloadToken] = useState(0)
  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false

    Promise.all([maintenanceService.getOverview(), carsService.getMyCars()])
      .then(([data, myCars]) => {
        if (cancelled) return
        setOverview(data)
        setCars(myCars)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca mentenanța.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const remove = async (id: string) => {
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
  const entries = overview?.entries ?? []
  const now = new Date()

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Mentenanță"
        subtitle="Istoric service, costuri și remindere pe dată sau pe kilometraj."
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddRoundedIcon />}
            disabled={cars.length === 0}
            onClick={() => setDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Adaugă intervenție
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
          <Panel dense>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
              Cost mentenanță
            </Typography>
            <Box sx={{ mt: 0.8 }}>
              <Amount value={summary.costLast30DaysBani / 100} unit="lei" size="card" decimals={0} />
            </Box>
            <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.6 }}>
              ultimele 30 de zile
            </Typography>
          </Panel>
          <StatCard label="Intervenții programate" value={String(summary.scheduledCount)} />
          <StatCard label="Remindere active" value={String(summary.activeReminders)} />
          <StatCard label="Vehicule monitorizate" value={String(summary.monitoredCars)} />
        </Box>
      )}

      <Panel title="Programări și istoric" subtitle="Ce urmează și ce s-a făcut, în ordine cronologică.">
        {entries.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 2 }}>
            {cars.length === 0
              ? 'Adaugă întâi o mașină în flotă — mentenanța se atașează unei mașini.'
              : 'Nicio intervenție înregistrată. Adaugă prima ca să începi istoricul.'}
          </Typography>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <Box component="thead">
                <Box component="tr">
                  {['Intervenție', 'Mașină', 'Data', 'Kilometraj', 'Cost', '', ''].map((h, i) => (
                    <Box component="th" key={h || i} sx={headSx}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} now={now} onDelete={() => void remove(entry.id)} />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Panel>

      <AddDialog
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

function EntryRow({
  entry,
  now,
  onDelete,
}: {
  entry: MaintenanceEntry
  now: Date
  onDelete: () => void
}) {
  const scheduled = new Date(entry.performedAtUtc) > now

  return (
    <Box component="tr">
      <Box component="td" sx={cellSx}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink }}>
          {entry.title}
        </Typography>
        {entry.notes && (
          <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
            {entry.notes}
          </Typography>
        )}
      </Box>
      <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
        {entry.carLabel}
      </Box>
      <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', fontWeight: 700 }}>
        {formatDate(entry.performedAtUtc)}
      </Box>
      <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
        {entry.mileage != null ? `${entry.mileage.toLocaleString('ro-RO')} km` : '—'}
      </Box>
      <Box component="td" sx={cellSx}>
        <Amount value={entry.costBani / 100} unit="lei" size="row" decimals={0} />
      </Box>
      <Box component="td" sx={cellSx}>
        {scheduled ? (
          <StatusChip label="Programată" tone="warning" size="sm" outlined />
        ) : (
          <ReminderChip entry={entry} now={now} />
        )}
      </Box>
      <Box component="td" sx={{ ...cellSx, textAlign: 'right' }}>
        <IconButton
          size="small"
          aria-label={`Șterge intervenția ${entry.title}`}
          onClick={onDelete}
          sx={{ color: DASHBOARD_TOKENS.textMuted, '&:hover': { color: DASHBOARD_TOKENS.stateError } }}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}

/** Reminderul, dacă există. Cel pe kilometraj nu are dată, deci se arată ca prag, nu ca termen. */
function ReminderChip({ entry, now }: { entry: MaintenanceEntry; now: Date }) {
  if (entry.reminderMileage != null) {
    return <StatusChip label={`La ${entry.reminderMileage.toLocaleString('ro-RO')} km`} tone="neutral" size="sm" />
  }

  if (entry.reminderDateUtc) {
    const due = new Date(entry.reminderDateUtc)
    const days = Math.round((due.getTime() - now.getTime()) / 86_400_000)
    if (days < 0) return <StatusChip label="Reminder depășit" tone="error" size="sm" outlined />
    return <StatusChip label={`În ${days} zile`} tone={days <= 14 ? 'warning' : 'neutral'} size="sm" outlined />
  }

  return null
}

function AddDialog({
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
  // `null` = utilizatorul n-a ales încă, deci se folosește prima mașină. Un `useEffect` care ar
  // fi scris alegerea în stare ar fi fost o sincronizare inutilă a unei valori derivabile.
  const [pickedCarId, setPickedCarId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(todayIso())
  const [mileage, setMileage] = useState('')
  const [cost, setCost] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderMileage, setReminderMileage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prima mașină e preselectată: majoritatea flotelor mici au una singură.
  const carId = pickedCarId ?? cars[0]?.id ?? ''

  const save = async () => {
    if (!carId || !title.trim()) {
      setError('Alege mașina și scrie ce s-a făcut.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await maintenanceService.add({
        carId,
        title: title.trim(),
        notes: notes.trim() || null,
        // Data locală se trimite ca UTC la miezul zilei, ca fusul să n-o mute cu o zi înapoi.
        performedAtUtc: new Date(`${date}T12:00:00Z`).toISOString(),
        mileage: mileage ? Number(mileage) : null,
        costBani: cost ? Math.round(Number(cost) * 100) : 0,
        reminderDateUtc: reminderDate ? new Date(`${reminderDate}T12:00:00Z`).toISOString() : null,
        reminderMileage: reminderMileage ? Number(reminderMileage) : null,
      })
      setTitle('')
      setNotes('')
      setMileage('')
      setCost('')
      setReminderDate('')
      setReminderMileage('')
      onSaved()
    } catch {
      setError('Nu am putut salva intervenția.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Adaugă intervenție</DialogTitle>
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

          <TextField
            label="Ce s-a făcut"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
            placeholder="Schimb filtre habitaclu"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="O dată viitoare o marchează drept programare."
            />
            <TextField
              label="Kilometraj"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Cost (lei)"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Reminder la km"
              type="number"
              value={reminderMileage}
              onChange={(e) => setReminderMileage(e.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
            <TextField
              label="Reminder la dată"
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              fullWidth
              size="small"
              sx={{ ...dashboardInputSx, gridColumn: { xs: 'auto', sm: '1 / -1' } }}
              slotProps={{ inputLabel: { shrink: true } }}
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
