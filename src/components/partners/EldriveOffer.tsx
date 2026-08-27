import { Box, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import {
  ELDRIVE_CAPABILITIES,
  ELDRIVE_INTEGRATION,
  ELDRIVE_NETWORK,
  ELDRIVE_TARIFFS,
} from '../../data/eldrive'

/**
 * Oferta Eldrive, aceeași componentă în pagina publică de Parteneri și în Beneficii.
 *
 * Urmează structura materialului primit de la partener — trei tarife, blocul de integrare, cele
 * trei lucruri pe care le vezi despre o stație — dar desenată cu tokenii noștri, nu cu ai lui.
 *
 * Accentul de culoare stă doar pe tarifele mici. Cele trei sume nu sunt trei opțiuni între care
 * alegi: sunt același preț la ore diferite, iar culoarea spune când merită încărcat.
 */

interface OfferTokens {
  ink: string
  primary: string
  primaryStrong: string
  paper: string
  surface: string
  border: string
  textMuted: string
  textSubtle: string
  radius: { md: number; lg: number; xl: number; full: number }
}

interface EldriveOfferProps {
  tokens: OfferTokens
  /** Titlul secțiunii diferă între prezentarea publică și dashboard. */
  title: string
}

export function EldriveOffer({ tokens, title }: EldriveOfferProps) {
  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography sx={{ fontWeight: 850, fontSize: '1.15rem', color: tokens.ink, mb: 2 }}>
          {title}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: { xs: 1.8, md: 2.5 },
          }}
        >
          {ELDRIVE_TARIFFS.map((tariff) => (
            <Box
              key={tariff.key}
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: `${tokens.radius.lg}px`,
                border: `1px solid ${tariff.highlighted ? alpha(tokens.primary, 0.4) : tokens.border}`,
                backgroundColor: tariff.highlighted ? alpha(tokens.primary, 0.06) : tokens.paper,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: tokens.ink }}>
                {tariff.title}
              </Typography>
              <Typography sx={{ fontSize: '0.76rem', color: tokens.textMuted, mt: 0.3, mb: 1.6 }}>
                {tariff.scope}
              </Typography>

              <Typography
                sx={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  letterSpacing: -1,
                  lineHeight: 1,
                  color: tariff.highlighted ? tokens.primaryStrong : tokens.ink,
                  mt: 'auto',
                }}
              >
                {tariff.price}
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 650, color: tokens.textMuted, mt: 0.5 }}>
                {tariff.unit}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Ce e integrat la noi, nu la partener */}
      <Box
        sx={{
          p: { xs: 2.2, md: 2.8 },
          borderRadius: `${tokens.radius.lg}px`,
          border: `1px solid ${tokens.border}`,
          backgroundColor: tokens.surface,
        }}
      >
        <Chip
          label={ELDRIVE_INTEGRATION.badge}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.7rem',
            backgroundColor: alpha(tokens.primary, 0.14),
            color: tokens.primaryStrong,
            borderRadius: `${tokens.radius.full}px`,
            mb: 1.4,
          }}
        />
        <Typography sx={{ fontWeight: 850, fontSize: '1.05rem', color: tokens.ink, mb: 1 }}>
          {ELDRIVE_INTEGRATION.title}
        </Typography>
        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 900, lineHeight: 1, color: tokens.ink }}>
            {ELDRIVE_INTEGRATION.stationCount}
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', color: tokens.textMuted, lineHeight: 1.5 }}>
            {ELDRIVE_INTEGRATION.text}, în {ELDRIVE_NETWORK.area}.
          </Typography>
        </Stack>
      </Box>

      {/* Ce vezi despre fiecare stație */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: { xs: 2.2, md: 3 },
        }}
      >
        {ELDRIVE_CAPABILITIES.map((capability, index) => (
          <Box key={capability.title}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: 1,
                color: tokens.primaryStrong,
                mb: 0.9,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: tokens.ink, mb: 0.5 }}>
              {capability.title}
            </Typography>
            <Typography sx={{ fontSize: '0.86rem', color: tokens.textMuted, lineHeight: 1.65 }}>
              {capability.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  )
}
