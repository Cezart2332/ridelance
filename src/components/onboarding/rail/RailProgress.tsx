import { Box, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'

import { useMotionTokens } from '../motion'
import { SHELL } from '../shellTokens'

/**
 * Cardul de progres din capul rail-ului: unde ești, cât ai făcut, cât mai durează pasul curent.
 *
 * E singura suprafață închisă din tot shell-ul. Contrastul nu e decorativ: rail-ul e o listă
 * lungă de rânduri deschise, iar ancora „unde sunt" trebuie găsită dintr-o privire. Din același
 * motiv nu mai există o a doua suprafață închisă nicăieri — două ar anula-o pe prima.
 *
 * Inelul și bara arată același lucru, deci nu se dublează: inelul dă procentul exact, bara dă
 * forma. Ambele numără pași finalizați, nu ecrane — un contor care sare înapoi la fiecare pas nou
 * nu înseamnă nimic.
 */
export function RailProgress({
  done,
  total,
  position,
  stepLabel,
  estimate,
}: {
  done: number
  total: number
  /** Pasul curent, 1-based. Singurul contor din interfață — topbarul îl repetă, nu îl contrazice. */
  position: number
  stepLabel?: string | null
  /** Timp estimat pentru pasul curent, ex. „≈ 2 min". */
  estimate?: string | null
}) {
  const { step } = useMotionTokens()
  const ratio = total > 0 ? done / total : 0
  const percent = Math.round(ratio * 100)

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: SHELL.radius.card,
        backgroundColor: SHELL.text.primary,
        color: '#FFFFFF',
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.55)',
            }}
          >
            Înscriere
          </Typography>
          <Typography sx={{ ...SHELL.tabular, fontSize: 17, fontWeight: 600, mt: 0.25 }}>
            Pasul {position} din {total}
          </Typography>
        </Box>

        <ProgressRing percent={percent} />
      </Stack>

      {(stepLabel || estimate) && (
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mt: 1.5 }}
        >
          <Typography noWrap sx={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', minWidth: 0 }}>
            {stepLabel}
          </Typography>
          {estimate && (
            <Typography
              sx={{ ...SHELL.tabular, fontSize: 12, color: 'rgba(255, 255, 255, 0.55)', flexShrink: 0 }}
            >
              {estimate}
            </Typography>
          )}
        </Stack>
      )}

      <Box
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${done} din ${total} pași finalizați`}
        sx={{
          mt: 1,
          height: 3,
          borderRadius: SHELL.radius.pill,
          backgroundColor: 'rgba(255, 255, 255, 0.14)',
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
    </Box>
  )
}

/** Inel subțire cu procentul în mijloc. SVG, nu două `CircularProgress` suprapuse. */
function ProgressRing({ percent }: { percent: number }) {
  const size = 44
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const { step } = useMotionTokens()

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box component="svg" viewBox={`0 0 ${size} ${size}`} sx={{ width: size, height: size }} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={SHELL.brand}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={step}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Box>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ ...SHELL.tabular, fontSize: 12, fontWeight: 600 }}>{percent}%</Typography>
      </Box>
    </Box>
  )
}
