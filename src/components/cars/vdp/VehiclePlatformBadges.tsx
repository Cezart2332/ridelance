import { Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../../constants/tokens'
import type { Car } from '../../../services/cars.service'

/**
 * Pe ce categorii poate lucra mașina (spec §11).
 *
 * Dacă nu e eligibilă nicăieri, secțiunea nu se randează deloc — nu are rost un titlu urmat de
 * nimic. Categoriile sunt ale mașinii, nu ale șoferului: contul de platformă rămâne sarcina lui.
 */
export function VehiclePlatformBadges({ car }: { car: Car }) {
  const platforms = [
    { name: 'Uber', color: TOKENS.ink, categories: car.uberCategories },
    { name: 'Bolt', color: '#34D186', categories: car.boltCategories },
  ].filter((p) => p.categories.length > 0)

  if (platforms.length === 0) {
    return null
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1.5}>
        {platforms.map((platform) => (
          <Stack
            key={platform.name}
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          >
            <Typography
              sx={{
                minWidth: 56,
                fontWeight: 800,
                fontSize: '0.85rem',
                color: platform.color,
              }}
            >
              {platform.name}
            </Typography>
            {platform.categories.map((category) => (
              <Chip
                key={category}
                label={category}
                size="small"
                sx={{
                  fontWeight: 600,
                  color: TOKENS.ink,
                  backgroundColor: alpha(platform.color, 0.08),
                  border: `1px solid ${alpha(platform.color, 0.2)}`,
                }}
              />
            ))}
          </Stack>
        ))}
      </Stack>

      <Typography sx={{ fontSize: '0.9rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>
        Categoriile de mai sus sunt cele pentru care mașina îndeplinește condițiile de vehicul.
        Înscrierea pe platformă rămâne pe contul tău — te ajutăm cu documentele la momentul potrivit.
      </Typography>
    </Stack>
  )
}
