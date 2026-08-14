import { Box, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'

import { useMotionTokens } from '../motion'
import { SHELL } from '../shellTokens'

/**
 * Cardul de progres general din capul rail-ului: „Pasul 3 din 6", bară, procent și timpul estimat
 * pentru pasul curent. Cifrele sunt tabulare ca să nu salte la fiecare actualizare.
 */
export function RailProgress({
  done,
  total,
  position,
  estimate,
}: {
  done: number
  total: number
  /** Pasul curent, 1-based. Singurul contor din interfață — topbarul îl repetă, nu îl contrazice. */
  position: number
  /** Timp estimat pentru pasul curent, ex. „~5 minute". */
  estimate?: string | null
}) {
  const { step } = useMotionTokens()
  const ratio = total > 0 ? done / total : 0

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 12,
            color: SHELL.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Înrolare
        </Typography>
        <Typography sx={{ ...SHELL.tabular, fontWeight: 600, fontSize: 13, color: SHELL.text.primary }}>
          Pasul {position} din {total}
        </Typography>
      </Stack>

      <Box
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${done} din ${total} pași finalizați`}
        sx={{
          height: 4,
          borderRadius: SHELL.radius.pill,
          backgroundColor: SHELL.border.subtle,
          overflow: 'hidden',
        }}
      >
        {/* scaleX, nu width — animăm doar transform. */}
        <Box
          component={motion.div}
          initial={false}
          animate={{ scaleX: ratio }}
          transition={step}
          sx={{
            height: '100%',
            width: '100%',
            transformOrigin: 'left center',
            borderRadius: SHELL.radius.pill,
            backgroundColor: SHELL.brand,
          }}
        />
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
        <Typography sx={{ ...SHELL.tabular, fontSize: 12, color: SHELL.text.secondary }}>
          {total > 0 ? Math.round((done / total) * 100) : 0}%
        </Typography>
        {estimate && (
          <Typography sx={{ fontSize: 12, color: SHELL.text.tertiary }}>{estimate}</Typography>
        )}
      </Stack>
    </Box>
  )
}
