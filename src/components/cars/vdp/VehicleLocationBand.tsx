import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../../constants/tokens'
import { VDP, fullBleed } from './vdpLayout'

/**
 * Banda de locație (spec §7), fără hartă.
 *
 * Anunțurile au orașul ca text, nu coordonate. O hartă ar trebui deci să arate un punct ales de
 * noi — adică o adresă inventată, exact lucrul pe care specul îl evită prin cercul aproximativ.
 * Rămâne banda și panelul, pe un fundal grafic care sugerează o hartă fără să pretindă că e una.
 */
export function VehicleLocationBand({ city }: { city: string }) {
  return (
    <Box
      component="section"
      id="locatie"
      sx={{
        ...fullBleed,
        position: 'relative',
        height: { xs: 320, md: 440 },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        scrollMarginTop: { xs: VDP.headerOffset.xs, md: VDP.headerOffset.md },
        backgroundColor: TOKENS.surfaceAlt,
        // Grilă discretă + două halouri: textura unei hărți, fără geografie inventată.
        backgroundImage: `
          radial-gradient(circle at 22% 40%, ${alpha(TOKENS.primary, 0.18)} 0%, transparent 45%),
          radial-gradient(circle at 78% 65%, ${alpha(TOKENS.primary, 0.12)} 0%, transparent 40%),
          linear-gradient(${alpha(TOKENS.ink, 0.04)} 1px, transparent 1px),
          linear-gradient(90deg, ${alpha(TOKENS.ink, 0.04)} 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: VDP.maxWidth,
          mx: 'auto',
          px: `${VDP.gutter}px`,
        }}
      >
        <Box
          sx={{
            maxWidth: 420,
            p: 3,
            borderRadius: `${VDP.radius.card}px`,
            backgroundColor: TOKENS.paper,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.lg,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: TOKENS.textSubtle,
            }}
          >
            Zona de ridicare
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontSize: '1.6rem',
              fontWeight: 900,
              letterSpacing: VDP.display.letterSpacing,
              color: TOKENS.ink,
            }}
          >
            {city}
          </Typography>

          <Box sx={{ my: 2.5, height: '1px', backgroundColor: TOKENS.border }} />

          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: TOKENS.textSubtle,
            }}
          >
            Adresa exactă
          </Typography>
          <Typography sx={{ mt: 0.75, color: TOKENS.textMuted, lineHeight: 1.7 }}>
            Se stabilește după ce vorbim — punctul de predare se alege împreună, în funcție de unde
            îți e mai la îndemână.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
