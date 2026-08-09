import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import { Box, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material'

import { OFFICE_ADDRESS, OfficeBookingCalendar } from '../../office/OfficeBookingCalendar'
import { displaySx, TOKENS } from '../onboardingTheme'

interface OfficeBookingDialogProps {
  open: boolean
  onClose: () => void
  defaultName?: string
  defaultEmail?: string
  defaultPhone?: string
}

/**
 * Programarea la birou, pentru cine preferă să rezolve față în față.
 *
 * Calendarul e cel din `src/components/office/OfficeBookingCalendar.tsx` — același de pe pagina de
 * contact și din dashboard, peste aceleași endpointuri (`office/slots`, `office/appointments`).
 * Aici primește doar un cadru: onboardingul nu are unde să-l așeze inline fără să scoată userul
 * din pasul curent.
 */
export function OfficeBookingDialog({
  open,
  onClose,
  defaultName,
  defaultEmail,
  defaultPhone,
}: OfficeBookingDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="office-booking-title"
      slotProps={{ paper: { sx: { borderRadius: `${TOKENS.radius.xl}px` } } }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, pt: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: `${TOKENS.radius.md}px`,
              display: 'grid',
              placeItems: 'center',
              color: TOKENS.primaryStrong,
              backgroundColor: TOKENS.primaryTint,
            }}
          >
            <EventAvailableRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id="office-booking-title"
              component="h2"
              sx={{ ...displaySx, fontSize: '1.05rem', fontWeight: 700, color: TOKENS.ink }}
            >
              Programează o vizită la birou
            </Typography>
            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
              {OFFICE_ADDRESS}
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} aria-label="Închide" size="small">
          <CloseRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted }} />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: 3, pb: 3, pt: 2 }}>
        <OfficeBookingCalendar
          embedded
          compact
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          defaultPhone={defaultPhone}
        />
      </DialogContent>
    </Dialog>
  )
}
