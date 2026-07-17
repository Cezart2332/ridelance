import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import OtherHousesRoundedIcon from '@mui/icons-material/OtherHousesRounded'
import FlightTakeoffRoundedIcon from '@mui/icons-material/FlightTakeoffRounded'
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded'
import CarRepairRoundedIcon from '@mui/icons-material/CarRepairRounded'
import HealthAndSafetyRoundedIcon from '@mui/icons-material/HealthAndSafetyRounded'
import HealingRoundedIcon from '@mui/icons-material/HealingRounded'
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded'
import LuggageRoundedIcon from '@mui/icons-material/LuggageRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import { TOKENS } from '../../constants/tokens'

const insuranceUrl = (slug: string) => `https://www.asigurari.ro/asigurare/${slug}/p/r1d3l@`

interface InsuranceLink {
  slug: string
  label: string
  description: string
  icon: ReactNode
}

export const INSURANCE_LINKS: InsuranceLink[] = [
  {
    slug: 'rca',
    label: 'RCA',
    description: 'Asigurarea auto obligatorie de răspundere civilă.',
    icon: <DirectionsCarFilledRoundedIcon />,
  },
  {
    slug: 'casco',
    label: 'CASCO',
    description: 'Asigurare auto facultativă cu acoperire completă.',
    icon: <ShieldRoundedIcon />,
  },
  {
    slug: 'casco_econom',
    label: 'CASCO Econom',
    description: 'Varianta accesibilă a asigurării CASCO.',
    icon: <SavingsRoundedIcon />,
  },
  {
    slug: 'home',
    label: 'Locuință',
    description: 'Asigurare facultativă pentru locuință și bunuri.',
    icon: <HomeRoundedIcon />,
  },
  {
    slug: 'pad',
    label: 'PAD',
    description: 'Asigurarea obligatorie a locuinței împotriva dezastrelor.',
    icon: <OtherHousesRoundedIcon />,
  },
  {
    slug: 'travel',
    label: 'Călătorie',
    description: 'Asigurare de călătorie pentru vacanțe și deplasări.',
    icon: <FlightTakeoffRoundedIcon />,
  },
  {
    slug: 'malpraxis',
    label: 'Malpraxis',
    description: 'Asigurare de răspundere civilă profesională.',
    icon: <MedicalServicesRoundedIcon />,
  },
  {
    slug: 'breakdown',
    label: 'Asistență rutieră',
    description: 'Ajutor rapid în caz de defecțiuni pe drum.',
    icon: <CarRepairRoundedIcon />,
  },
  {
    slug: 'health',
    label: 'Sănătate',
    description: 'Asigurare privată de sănătate.',
    icon: <HealthAndSafetyRoundedIcon />,
  },
  {
    slug: 'accidents',
    label: 'Accidente persoane',
    description: 'Protecție financiară în caz de accidente.',
    icon: <HealingRoundedIcon />,
  },
  {
    slug: 'accidents_taxi',
    label: 'Accidente taxi & ridesharing',
    description: 'Asigurare de accidente pentru șoferi și pasageri.',
    icon: <LocalTaxiRoundedIcon />,
  },
  {
    slug: 'accidents_traveler',
    label: 'Accidente călători',
    description: 'Asigurare de accidente pentru pasageri pe durata călătoriei.',
    icon: <LuggageRoundedIcon />,
  },
  {
    slug: 'cmr',
    label: 'CMR',
    description: 'Asigurare pentru mărfurile transportate.',
    icon: <LocalShippingRoundedIcon />,
  },
]

interface InsuranceLinksGridProps {
  /** Smaller cards and paddings for embedding inside dashboards. */
  compact?: boolean
}

export function InsuranceLinksGrid({ compact = false }: InsuranceLinksGridProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: compact ? 2 : 2.5,
      }}
    >
      {INSURANCE_LINKS.map((item) => (
        <Box
          key={item.slug}
          component="a"
          href={insuranceUrl(item.slug)}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            width: {
              xs: '100%',
              sm: `calc(50% - ${compact ? 8 : 10}px)`,
              md: compact ? 236 : 262,
            },
            display: 'flex',
            flexDirection: 'column',
            p: compact ? 2.2 : 3,
            borderRadius: TOKENS.radius.lg,
            border: `1px solid ${TOKENS.border}`,
            backgroundColor: TOKENS.paper,
            boxShadow: TOKENS.shadow.sm,
            textDecoration: 'none',
            transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
            '&:hover': {
              borderColor: TOKENS.primary,
              boxShadow: TOKENS.shadow.lg,
              transform: 'translateY(-3px)',
            },
          }}
        >
          <Box
            sx={{
              width: compact ? 40 : 46,
              height: compact ? 40 : 46,
              borderRadius: TOKENS.radius.md,
              display: 'grid',
              placeItems: 'center',
              backgroundColor: alpha(TOKENS.primary, 0.12),
              color: TOKENS.primaryStrong,
              mb: 1.6,
              '& svg': { fontSize: compact ? 22 : 25 },
            }}
          >
            {item.icon}
          </Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: compact ? '0.98rem' : '1.05rem',
              color: TOKENS.ink,
              lineHeight: 1.3,
            }}
          >
            {item.label}
          </Typography>
          <Typography
            sx={{
              color: TOKENS.textMuted,
              fontSize: compact ? '0.82rem' : '0.86rem',
              lineHeight: 1.55,
              mt: 0.6,
              mb: 1.6,
            }}
          >
            {item.description}
          </Typography>
          <Stack
            direction="row"
            spacing={0.6}
            sx={{ alignItems: 'center', mt: 'auto' }}
          >
            <Typography
              sx={{
                fontWeight: 750,
                fontSize: '0.82rem',
                color: TOKENS.primaryStrong,
              }}
            >
              Vezi oferta pe asigurari.ro
            </Typography>
            <OpenInNewRoundedIcon
              sx={{ fontSize: 15, color: TOKENS.primaryStrong }}
            />
          </Stack>
        </Box>
      ))}
    </Box>
  )
}
