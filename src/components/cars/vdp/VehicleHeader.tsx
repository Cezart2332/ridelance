import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Chip, Stack, Typography } from '@mui/material'
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

/**
 * Titlul paginii și cele câteva date care spun imediat despre ce mașină e vorba (spec §4).
 *
 * Fără rating și fără „N închirieri finalizate": nu avem recenzii în sistem, iar un rating inventat
 * e mai rău decât unul lipsă.
 */

/** Sub acest prag nu se afișează nimic: „3 persoane" sună a anunț mort (spec §18). */
const VIEWS_THRESHOLD = 20

export function VehicleHeader({ car }: { car: Car }) {
  const statusColor = getCarStatusColor(car.status)
  const views = car.stats?.viewsLast7Days ?? 0

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '1.9rem', md: '2.5rem' },
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: TOKENS.ink,
          lineHeight: 1.15,
        }}
      >
        {car.brand} {car.model} {car.year}
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'center', color: TOKENS.textMuted }}
      >
        <Meta icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />}>{car.location}</Meta>
        <Meta icon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />}>{car.transmission}</Meta>
        <Meta icon={<LocalGasStationOutlinedIcon sx={{ fontSize: 18 }} />}>{car.engine}</Meta>
        {views >= VIEWS_THRESHOLD && (
          <Meta icon={<VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}>
            {views} persoane au văzut mașina în ultimele 7 zile
          </Meta>
        )}
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip
          label={formatCarStatus(car.status)}
          size="small"
          sx={{
            fontWeight: 700,
            color: statusColor,
            backgroundColor: alpha(statusColor, 0.1),
            border: `1px solid ${alpha(statusColor, 0.25)}`,
          }}
        />
        <Chip
          label={formatCarOfferType(car.offerType)}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, borderColor: TOKENS.border, color: TOKENS.textMuted }}
        />
        <Chip
          label={formatCarListingLabel(car.listingSource)}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, borderColor: TOKENS.border, color: TOKENS.textMuted }}
        />
      </Stack>
    </Stack>
  )
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box sx={{ display: 'flex', color: TOKENS.textSubtle }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.92rem', fontWeight: 500 }}>{children}</Typography>
    </Stack>
  )
}
