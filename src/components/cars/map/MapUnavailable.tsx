import { Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import MapRoundedIcon from '@mui/icons-material/MapRounded'

import { TOKENS } from '../../../constants/tokens'

/**
 * Ce se vede în locul hărții când nu există token Mapbox.
 *
 * Alternativa — un container gol — arată ca o pagină stricată și trimite pe cineva să caute un
 * bug care nu există. Mesajul spune exact ce lipsește.
 */
export function MapUnavailable({ hint }: { hint?: string }) {
  return (
    <Stack
      spacing={1}
      sx={{
        height: '100%',
        minHeight: 240,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3,
        bgcolor: alpha(TOKENS.ink, 0.03),
        border: `1px dashed ${TOKENS.border}`,
        borderRadius: `${TOKENS.radius.lg}px`,
      }}
    >
      <MapRoundedIcon sx={{ fontSize: 32, color: TOKENS.textSubtle }} />
      <Typography sx={{ fontWeight: 700, color: TOKENS.ink, fontSize: '0.92rem' }}>
        Harta nu e disponibilă
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', color: TOKENS.textMuted, maxWidth: 380, lineHeight: 1.55 }}>
        {hint ??
          'Lipsește VITE_MAPBOX_TOKEN din build. Vite coace variabilele `VITE_*` în bundle, deci tokenul trebuie dat ca build arg — setat doar ca variabilă de runtime nu ajunge la el.'}
      </Typography>
    </Stack>
  )
}
