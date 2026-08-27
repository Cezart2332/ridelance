import { Box, Chip, Stack, Typography } from '@mui/material'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Link } from 'react-router-dom'

import { TOKENS } from '../../../constants/tokens'
import { getCarImageUrl } from '../../../services/cars.service'
import type { FleetMapPoint } from './FleetMap'

/**
 * Cardul care se deschide peste pin, la click pe o mașină.
 *
 * Înainte, pinul deschidea două rânduri de text — titlu și o listă de specificații lipite cu
 * puncte. Ca să afli dacă mașina te interesează trebuia să pleci din hartă, iar dacă nu te
 * interesa te întorceai. Cardul răspunde la întrebarea „asta ce e?" pe loc: poză, preț și cele
 * trei specificații după care se filtrează oricum, cu drumul spre anunț la un click.
 *
 * Lățime fixă, nu procentuală: un popup ancorat de un punct de pe hartă nu are un părinte a
 * cărui lățime să însemne ceva.
 */

const CARD_WIDTH = 268

const formatPrice = (value: number) => `${Math.round(value).toLocaleString('ro-RO')} lei`

interface CarMapCardProps {
  point: FleetMapPoint
}

export function CarMapCard({ point }: CarMapCardProps) {
  const discounted = point.oldPrice != null && point.oldPrice > point.pricePerWeek

  return (
    <Box sx={{ width: CARD_WIDTH, bgcolor: TOKENS.paper, color: TOKENS.ink }}>
      <Box
        sx={{
          position: 'relative',
          height: 132,
          bgcolor: TOKENS.surfaceAlt,
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {point.imageUrl ? (
          <Box
            component="img"
            src={getCarImageUrl(point.imageUrl)}
            alt=""
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <DirectionsCarFilledRoundedIcon sx={{ fontSize: 40, color: TOKENS.textSubtle }} />
        )}

        <Chip
          size="small"
          label={point.statusLabel}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#FFFFFF',
            // Verdele apare o singură dată în tot cardul, exact ca pe pin, și înseamnă același
            // lucru. Restul stărilor rămân neutre ca să nu concureze cu el.
            bgcolor: point.available ? 'rgba(22,163,74,0.94)' : 'rgba(26,26,46,0.78)',
            '& .MuiChip-label': { px: 0.9 },
          }}
        />
      </Box>

      <Box sx={{ p: 1.5 }}>
        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: 800,
            lineHeight: 1.3,
            mb: 0.75,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {point.title}
        </Typography>

        {point.specs.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.6, mb: 1.1 }}>
            {point.specs.map((spec) => (
              <Chip
                key={spec}
                size="small"
                label={spec}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: TOKENS.textMuted,
                  bgcolor: TOKENS.surface,
                  border: `1px solid ${TOKENS.border}`,
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            ))}
          </Stack>
        )}

        <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.7, mb: 1.3 }}>
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1 }}>
            {formatPrice(point.pricePerWeek)}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: TOKENS.textMuted }}>
            / săptămână
          </Typography>
          {discounted && (
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: TOKENS.textSubtle,
                textDecoration: 'line-through',
                ml: 'auto',
              }}
            >
              {formatPrice(point.oldPrice!)}
            </Typography>
          )}
        </Stack>

        <Box
          component={Link}
          to={`/masini/${point.slug}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.6,
            width: '100%',
            py: 0.95,
            borderRadius: `${TOKENS.radius.md}px`,
            bgcolor: TOKENS.ink,
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 800,
            textDecoration: 'none',
            transition: `background-color ${TOKENS.duration} ${TOKENS.easing}`,
            '&:hover': { bgcolor: '#000000' },
          }}
        >
          Vezi anunțul
          <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    </Box>
  )
}
