import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import type { Car } from '../../../services/cars.service'
import { maintenanceService } from '../../../services/maintenance.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { DateField } from '../../common/DateField'

/**
 * O intervenție de service, ca dialog.
 *
 * Stătea în pagina de mentenanță, care e acum doar istoric. Ca la închirieri, intervenția se
 * înregistrează de pe mașina care a fost în service — `fixedCarId` ascunde atunci selectorul.
 */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface MaintenanceEntryDialogProps {
  open: boolean
  cars: Car[]
  /** Mașina, când dialogul se deschide de pe ea. */
  fixedCarId?: string
  onClose: () => void
  onSaved: () => void
}

export function MaintenanceEntryDialog({ open, cars, fixedCarId, onClose, onSaved }: MaintenanceEntryDialogProps) {
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
  const carId = fixedCarId ?? pickedCarId ?? cars[0]?.id ?? ''
  const selectedCar = cars.find((c) => c.id === carId)

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
      <DialogTitle sx={{ fontWeight: 800 }}>
        Adaugă intervenție
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
            <DateField
              label="Data"
              value={date}
              onChange={setDate}
              fullWidth
              size="small"
              sx={dashboardInputSx}
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
            <DateField
              label="Reminder la dată"
              value={reminderDate}
              onChange={setReminderDate}
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

export default MaintenanceEntryDialog
