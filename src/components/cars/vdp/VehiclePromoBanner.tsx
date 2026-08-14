import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link } from 'react-router-dom'

import character from '../../../assets/Stickers/character 2.png'
import { TOKENS } from '../../../constants/tokens'
import { VDP } from './vdpLayout'

/**
 * Banda promoțională (spec §9).
 *
 * Cine caută o mașină de închiriat pentru ridesharing are, de obicei, aceeași problemă imediat
 * după: PFA, ARR, facturi. Bannerul spune exact atât și trimite la abonamente — nu e o reclamă
 * lipită peste pagină, ci pasul următor din același drum.
 */
export function VehiclePromoBanner() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2.5}
      sx={{
        p: 2.5,
        alignItems: { xs: 'flex-start', sm: 'center' },
        borderRadius: `${VDP.radius.card}px`,
        backgroundColor: alpha(TOKENS.primary, 0.08),
      }}
    >
      <Box
        component="img"
        src={character}
        alt=""
        sx={{
          width: 72,
          height: 72,
          flexShrink: 0,
          objectFit: 'cover',
          borderRadius: `${VDP.radius.image}px`,
        }}
      />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, color: TOKENS.ink }}>
          Mașina e doar jumătate din poveste
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>
          PFA, autorizație ARR, conturile de platformă și facturile — de partea asta ne ocupăm noi.
        </Typography>
      </Box>

      <Button
        component={Link}
        to="/abonamente-preturi"
        sx={{
          flexShrink: 0,
          px: 2.5,
          py: 1,
          maxWidth: '100%',
          borderRadius: `${TOKENS.radius.full}px`,
          border: `1px solid ${TOKENS.ink}`,
          fontWeight: 700,
          textTransform: 'none',
          color: TOKENS.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '&:hover': { backgroundColor: alpha(TOKENS.ink, 0.04) },
        }}
      >
        Vezi abonamentele
      </Button>
    </Stack>
  )
}
