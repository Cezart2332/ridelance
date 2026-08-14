import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Box, ButtonBase, Drawer, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'
import { useState } from 'react'

import { useMotionTokens } from '../motion'
import { displaySx, tabularSx, TOKENS } from '../onboardingTheme'
import { completedCount, stepStateLabel, type StepView } from '../stepModel'
import { StepRailItem } from './StepRailItem'
import { StepStatusIcon } from './StepStatusIcon'

export const MOBILE_BAR_HEIGHT = 56

/**
 * Pe telefon rail-ul nu încape lângă conținut, deci devine o bară de progres fixată sus.
 * Lista completă de pași se deschide într-un sheet de jos — ajunge cu degetul mare.
 *
 * `position: fixed`, nu `sticky`: html/body/#root au toate `overflow-x: hidden` (src/main.tsx),
 * ceea ce rupe `position: sticky` în tot proiectul.
 */
export function MobileStepBar({
  steps,
  activeKey,
  onSelect,
}: {
  steps: StepView[]
  activeKey: string | null
  onSelect: (step: StepView) => void
}) {
  const [open, setOpen] = useState(false)
  const { step: stepTransition } = useMotionTokens()

  const done = completedCount(steps)
  const active = steps.find((s) => s.key === activeKey) ?? null
  const ratio = steps.length > 0 ? done / steps.length : 0

  const handleSelect = (step: StepView) => {
    setOpen(false)
    onSelect(step)
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          backgroundColor: TOKENS.paper,
          borderBottom: `1px solid ${TOKENS.border}`,
        }}
      >
        <ButtonBase
          onClick={() => setOpen(true)}
          aria-label="Vezi toți pașii înrolării"
          sx={{ width: '100%', display: 'block', textAlign: 'left', px: 2, height: MOBILE_BAR_HEIGHT }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.4, height: '100%' }}>
            {active && <StepStatusIcon state={active.state} order={active.order} size={26} />}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ ...displaySx, fontWeight: 700, fontSize: '0.88rem', color: TOKENS.ink }}
              >
                {active?.label ?? 'Înrolare'}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: TOKENS.textMuted }}>
                {active ? stepStateLabel(active.state) : 'Se încarcă'}
              </Typography>
            </Box>
            <Typography
              sx={{
                ...tabularSx,
                fontWeight: 700,
                fontSize: '0.8rem',
                color: TOKENS.textMuted,
                flexShrink: 0,
              }}
            >
              {done}/{steps.length}
            </Typography>
            <ExpandMoreRoundedIcon sx={{ color: TOKENS.textMuted, flexShrink: 0 }} />
          </Stack>
        </ButtonBase>

        <Box sx={{ height: 3, backgroundColor: 'rgba(26, 26, 46, 0.06)' }}>
          <Box
            component={motion.div}
            initial={false}
            animate={{ scaleX: ratio }}
            transition={stepTransition}
            sx={{
              height: '100%',
              width: '100%',
              transformOrigin: 'left center',
              backgroundColor: TOKENS.success,
            }}
          />
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: TOKENS.radius.xl,
              borderTopRightRadius: TOKENS.radius.xl,
              maxHeight: '85vh',
              px: 2,
              pt: 1.5,
              pb: 3,
            },
          },
        }}
      >
        <Box
          sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: TOKENS.border, mx: 'auto', mb: 2 }}
        />
        <Box
          component="ol"
          sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}
        >
          {steps.map((step) => (
            <StepRailItem
              key={step.key}
              step={step}
              active={step.key === activeKey}
              onSelect={handleSelect}
            />
          ))}
        </Box>
      </Drawer>
    </>
  )
}
