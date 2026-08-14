import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { TOKENS } from '../../../constants/tokens'
import type { Car } from '../../../services/cars.service'
import { formatCarOfferType } from '../../../utils/carLabels'
import { formatLei } from '../../../utils/vehiclePricing'

/**
 * Specificațiile rapide (spec §6): un rând de perechi icon + valoare, separate doar prin spațiu.
 *
 * Sunt exact datele pe care le are anunțul. Numărul de locuri, portbagajul și consumul lipsesc din
 * model, deci lipsesc și de aici — un „—" pe patru coloane n-ar informa pe nimeni.
 */
export function VehicleQuickSpecs({ car }: { car: Car }) {
  const specs: { icon: ReactNode; label: string; value: string }[] = [
    { icon: <CalendarMonthOutlinedIcon />, label: 'An fabricație', value: String(car.year) },
    { icon: <SettingsOutlinedIcon />, label: 'Cutie de viteze', value: car.transmission },
    { icon: <LocalGasStationOutlinedIcon />, label: 'Motorizare', value: car.engine },
    { icon: <LocationOnOutlinedIcon />, label: 'Oraș', value: car.location },
    { icon: <HandshakeOutlinedIcon />, label: 'Tip ofertă', value: formatCarOfferType(car.offerType) },
  ]

  if (car.garantie != null && car.garantie > 0) {
    specs.push({
      icon: <SavingsOutlinedIcon />,
      label: 'Garanție',
      value: `${formatLei(car.garantie)} lei`,
    })
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 3,
      }}
    >
      {specs.map((spec) => (
        <Stack key={spec.label} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', color: TOKENS.textSubtle, mt: '2px' }}>{spec.icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textSubtle, fontWeight: 600 }}>
              {spec.label}
            </Typography>
            <Typography sx={{ fontWeight: 700, color: TOKENS.ink }}>{spec.value}</Typography>
          </Box>
        </Stack>
      ))}
    </Box>
  )
}
