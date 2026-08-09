import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { ButtonBase, Stack, Tooltip, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

import { TOKENS } from '../onboardingTheme'

interface LockedNavItemProps {
  icon: SvgIconComponent
  label: string
  unlocked: boolean
  /** Ce se întâmplă când e deblocat. Cât e blocat, click-ul doar explică de ce. */
  onOpen?: () => void
  onBlockedClick: () => void
}

/**
 * Un serviciu care există, dar încă nu e al tău. Abonamentele și asigurările apar din prima ca să
 * se știe că urmează — dar nu se poate ajunge la ele: nu montăm ruta, nu cerem planurile, nu se
 * poate selecta nimic.
 *
 * Rămâne focusabil și cu tooltip cât e blocat: un element care dispare din tab-order nu poate
 * explica de ce nu merge.
 */
export function LockedNavItem({ icon: Icon, label, unlocked, onOpen, onBlockedClick }: LockedNavItemProps) {
  const content = (
    <ButtonBase
      onClick={unlocked ? onOpen : onBlockedClick}
      aria-disabled={!unlocked}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 1.5,
        px: 1.5,
        height: 40,
        borderRadius: `${TOKENS.radius.md}px`,
        opacity: unlocked ? 1 : 0.55,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        color: TOKENS.ink,
        transition: `background-color ${TOKENS.duration} ${TOKENS.easing}`,
        '&:hover': { backgroundColor: unlocked ? TOKENS.primarySoft : 'transparent' },
        '&:focus-visible': { outline: `2px solid ${TOKENS.primary}`, outlineOffset: 2 },
      }}
    >
      <Icon sx={{ fontSize: 19, color: TOKENS.textMuted, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>
        {label}
      </Typography>
      {!unlocked && <LockRoundedIcon sx={{ fontSize: 16, color: TOKENS.textSubtle, flexShrink: 0 }} />}
    </ButtonBase>
  )

  if (unlocked) return content

  return (
    <Tooltip title="Disponibil după finalizarea înrolării" placement="right">
      {/* `span` pentru că Tooltip are nevoie de un copil care primește evenimente de mouse. */}
      <Stack component="span" sx={{ width: '100%' }}>
        {content}
      </Stack>
    </Tooltip>
  )
}
