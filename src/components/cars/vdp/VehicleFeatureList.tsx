import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { TOKENS } from '../../../constants/tokens'
import type { Car } from '../../../services/cars.service'
import { formatCarOfferType } from '../../../utils/carLabels'
import { formatLei } from '../../../utils/vehiclePricing'

/**
 * Dotările, pe două coloane (spec §5).
 *
 * Lista se taie cu un fade și un buton „Vezi toate", nu cu un modal: conținutul e text simplu, iar
 * o fereastră peste pagină ar fi mai multă ceremonie decât informație. Expandarea se face pe loc și
 * fade-ul dispare.
 *
 * Coloana a doua apare doar dacă anunțul are atuuri — o coloană goală lângă una plină arată a bug.
 */

/** De la câte iteme pe coloană începe trunchierea. */
const VISIBLE = 6

interface FeatureColumn {
  label: string
  items: string[]
}

export function VehicleFeatureList({ car }: { car: Car }) {
  const [expanded, setExpanded] = useState(false)

  const columns: FeatureColumn[] = [
    {
      label: 'Vehicul',
      items: [
        `An fabricație ${car.year}`,
        `Cutie ${car.transmission.toLowerCase()}`,
        `Motorizare ${car.engine.toLowerCase()}`,
        `Disponibilă în ${car.location}`,
        formatCarOfferType(car.offerType),
        ...(car.garantie != null && car.garantie > 0
          ? [`Garanție ${formatLei(car.garantie)} lei, restituibilă`]
          : []),
      ],
    },
  ]

  if (car.badges.length > 0) {
    columns.push({ label: 'Atuuri', items: car.badges })
  }

  const total = columns.reduce((sum, column) => sum + column.items.length, 0)
  const truncated = !expanded && columns.some((column) => column.items.length > VISIBLE)

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: `repeat(${columns.length}, 1fr)` },
          gap: 4,
          // Masca taie ultimul rând în degrade, în loc să-l reteze brusc.
          ...(truncated
            ? {
                maskImage: 'linear-gradient(to bottom, #000 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, transparent 100%)',
              }
            : {}),
        }}
      >
        {columns.map((column) => (
          <Stack key={column.label} spacing={1.25}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: TOKENS.ink }}>
              {column.label}
            </Typography>
            {(expanded ? column.items : column.items.slice(0, VISIBLE)).map((item) => (
              <Typography key={item} sx={{ fontSize: '0.95rem', color: TOKENS.textMuted }}>
                {item}
              </Typography>
            ))}
          </Stack>
        ))}
      </Box>

      {columns.some((column) => column.items.length > VISIBLE) && (
        <Button
          onClick={() => setExpanded((value) => !value)}
          sx={{
            mt: 2.5,
            px: 2.5,
            py: 1,
            borderRadius: `${TOKENS.radius.full}px`,
            border: `1px solid ${TOKENS.borderHover}`,
            fontWeight: 700,
            textTransform: 'none',
            color: TOKENS.ink,
            '&:hover': { backgroundColor: TOKENS.surfaceAlt, borderColor: TOKENS.ink },
          }}
        >
          {expanded ? 'Arată mai puțin' : `Vezi toate cele ${total} detalii`}
        </Button>
      )}
    </Box>
  )
}
