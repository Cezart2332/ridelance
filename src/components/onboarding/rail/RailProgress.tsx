import { Box, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'

import { useMotionTokens } from '../motion'
import { displaySx, tabularSx, TOKENS } from '../onboardingTheme'

/** Bara de progres din capul rail-ului: „3 din 6”, cu cifre tabulare ca să nu salte. */
export function RailProgress({ done, total }: { done: number; total: number }) {
  const { step } = useMotionTokens()
  const ratio = total > 0 ? done / total : 0

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          sx={{
            ...displaySx,
            fontWeight: 700,
            fontSize: '0.8rem',
            color: TOKENS.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Înrolare
        </Typography>
        <Typography sx={{ ...tabularSx, fontWeight: 700, fontSize: '0.82rem', color: TOKENS.ink }}>
          {done} din {total}
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
          borderRadius: TOKENS.radius.full,
          backgroundColor: 'rgba(26, 26, 46, 0.08)',
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
            borderRadius: TOKENS.radius.full,
            backgroundColor: TOKENS.success,
          }}
        />
      </Box>
    </Box>
  )
}
