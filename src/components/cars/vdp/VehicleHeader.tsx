import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'

import { TOKENS } from '../../../constants/tokens'
import type { Car } from '../../../services/cars.service'
import {
  formatCarListingLabel,
  formatCarOfferType,
  formatCarStatus,
  getCarStatusColor,
} from '../../../utils/carLabels'
import { formatLei } from '../../../utils/vehiclePricing'
import { VDP } from './vdpLayout'

/**
 * Blocul de titlu (spec §4): H1 display, un rând de metadate separate prin „·" și un rând de chips.
 *
 * Fără rating și fără „N închirieri finalizate": nu avem recenzii în sistem, iar un rating inventat
 * e mai rău decât unul lipsă. Chipsurile preiau rolul specificațiilor rapide — sunt aceleași date,
 * dar citite dintr-o privire, lângă titlu.
 */

/** Sub acest prag nu se afișează nimic: „3 persoane" sună a anunț mort (spec §18). */
const VIEWS_THRESHOLD = 20

export function VehicleHeader({ car }: { car: Car }) {
  const views = car.stats?.viewsLast7Days ?? 0
  const statusColor = getCarStatusColor(car.status)
  const isAvailable = car.status === 'Available'

  const meta = [
    `${car.year}`,
    car.engine,
    car.transmission,
    car.location,
    views >= VIEWS_THRESHOLD ? `${views} vizualizări în ultimele 7 zile` : null,
  ].filter((item): item is string => Boolean(item))

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: 30, md: 38 },
            lineHeight: { xs: '36px', md: '44px' },
            letterSpacing: '-0.9px',
            fontWeight: 900,
            color: TOKENS.ink,
          }}
        >
          {car.brand} {car.model} {car.year}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ mt: 1, flexWrap: 'wrap', alignItems: 'center' }}
        >
          {meta.map((item, index) => (
            <Stack key={item} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {index > 0 && <Box sx={{ color: TOKENS.textSubtle }}>·</Box>}
              <Typography sx={{ fontSize: '0.95rem', color: TOKENS.textMuted, fontWeight: 500 }}>
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip
          icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 15 }} />}
          label={String(car.year)}
        />
        <Chip icon={<SettingsOutlinedIcon sx={{ fontSize: 15 }} />} label={car.transmission} />
        <Chip icon={<LocalGasStationOutlinedIcon sx={{ fontSize: 15 }} />} label={car.engine} />
        <Chip icon={<LocationOnOutlinedIcon sx={{ fontSize: 15 }} />} label={car.location} />
        <Chip
          icon={<HandshakeOutlinedIcon sx={{ fontSize: 15 }} />}
          label={formatCarOfferType(car.offerType)}
        />
        {car.garantie != null && car.garantie > 0 && (
          <Chip
            icon={<SavingsOutlinedIcon sx={{ fontSize: 15 }} />}
            label={`Garanție ${formatLei(car.garantie)} lei`}
          />
        )}
        <Chip
          icon={<VerifiedOutlinedIcon sx={{ fontSize: 15 }} />}
          label={formatCarListingLabel(car.listingSource)}
        />
        {/* Statusul apare doar când spune ceva: „Disponibil” e presupunerea implicită. */}
        {!isAvailable && <Chip label={formatCarStatus(car.status)} tone={statusColor} />}
      </Stack>
    </Stack>
  )
}

/** Pastila din spec: border 1px, iconiță într-un cerc la stânga, padding 8/12. */
function Chip({ icon, label, tone }: { icon?: ReactNode; label: string; tone?: string }) {
  const color = tone ?? TOKENS.ink

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        px: 1.5,
        py: 1,
        borderRadius: `${TOKENS.radius.full}px`,
        border: `1px solid ${tone ? alpha(tone, 0.3) : TOKENS.border}`,
        backgroundColor: tone ? alpha(tone, 0.06) : 'transparent',
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: TOKENS.primaryStrong,
            backgroundColor: alpha(TOKENS.primary, 0.12),
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color,
          letterSpacing: VDP.display.letterSpacing,
        }}
      >
        {label}
      </Typography>
    </Stack>
  )
}
