import { useState } from 'react'
import {
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
import type { Rental, RentalDocumentType } from '../../../services/rentals.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { RentalDocumentsPanel } from './RentalDocumentsPanel'

/**
 * Generarea unui document, pornită de pe mașină.
 *
 * Contractul și procesele-verbale nu sunt ale mașinii, ci ale unei închirieri — mașina n-are ce
 * semna singură. Dialogul face exact acest pas: alege închirierea (când sunt mai multe) și abia
 * apoi arată panoul de documente. Când nu există nicio închiriere o spune și oferă drumul, în loc
 * să dea o eroare pentru ceva ce nu e o greșeală.
 */

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('ro-RO')

/** Închirierea propusă: cea deschisă. Dintre cele încheiate, cea mai recentă. */
function preferredRental(rentals: Rental[]): Rental | null {
  const open = rentals.find((r) => r.status !== 'completed' && r.status !== 'cancelled')
  if (open) return open

  return [...rentals].sort((a, b) => b.startAtUtc.localeCompare(a.startAtUtc))[0] ?? null
}

export interface CarDocumentsDialogProps {
  open: boolean
  car: Car | null
  /** Închirierile mașinii, în ordinea în care le-a dat serverul. */
  rentals: Rental[]
  /** Ce documente se pot genera de aici. Lipsă = toate. */
  only?: RentalDocumentType[]
  title: string
  onClose: () => void
  /** Deschide o închiriere nouă — singurul drum când mașina n-a fost încă închiriată. */
  onNewRental: () => void
}

/**
 * Se montează doar când e deschis: alegerea închirierii pornește atunci din `preferredRental`,
 * fără un efect care s-o rescrie după prima randare. Între două deschideri poate apărea o
 * închiriere nouă, iar ea e cea la care se referă omul acum.
 */
export function CarDocumentsDialog(props: CarDocumentsDialogProps) {
  if (!props.open) return null

  return <CarDocumentsPicker {...props} />
}

function CarDocumentsPicker({ car, rentals, only, title, onClose, onNewRental }: CarDocumentsDialogProps) {
  const [rentalId, setRentalId] = useState<string | null>(() => preferredRental(rentals)?.id ?? null)

  const rental = rentals.find((r) => r.id === rentalId) ?? null

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>
        {title}
        {car && (
          <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: DASHBOARD_TOKENS.textMuted, mt: 0.2 }}>
            {car.brand} {car.model}, {car.year}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {rentals.length === 0 ? (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
              Documentele se fac pe o închiriere: ele scriu cine ia mașina, pe ce perioadă și pe ce
              bani. Mașina asta n-a fost încă închiriată.
            </Typography>
            <Box>
              <Button
                variant="contained"
                disableElevation
                onClick={onNewRental}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
              >
                Închiriere nouă
              </Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {/* Selectorul apare doar când chiar e ceva de ales. */}
            {rentals.length > 1 && (
              <TextField
                select
                label="Închirierea"
                value={rentalId ?? ''}
                onChange={(e) => setRentalId(e.target.value)}
                fullWidth
                size="small"
                sx={dashboardInputSx}
              >
                {rentals.map((entry) => (
                  <MenuItem key={entry.id} value={entry.id}>
                    {entry.publicCode} · {entry.tenant.name} · {formatDate(entry.startAtUtc)} –{' '}
                    {formatDate(entry.endAtUtc)}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {rental && <RentalDocumentsPanel rental={rental} only={only} />}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Închide
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CarDocumentsDialog
