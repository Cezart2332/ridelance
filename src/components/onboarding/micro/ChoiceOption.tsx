import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material'
import type { KeyboardEvent } from 'react'

import type { ChoiceDef } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'

interface ChoiceOptionProps {
  choice: ChoiceDef
  selected: boolean
  tabIndex: number
  onSelect: () => void
}

/**
 * O opțiune: textul răspunsului și indicatorul. Un rând, nimic de citit pe deasupra.
 *
 * O variantă `disabled` rămâne pe ecran, gri, cu eticheta ei („În curând") și cu explicația la
 * hover. Ascunsă, utilizatorul ar căuta o opțiune despre care i s-a spus că există.
 */
export function ChoiceOption({ choice, selected, tabIndex, onSelect }: ChoiceOptionProps) {
  const disabled = choice.disabled === true

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    onSelect()
  }

  const option = (
    <Stack
      direction="row"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        minHeight: 60,
        px: 2.5,
        py: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1.5px solid ${selected ? TOKENS.primary : TOKENS.border}`,
        backgroundColor: selected ? TOKENS.primarySoft : TOKENS.paper,
        opacity: disabled ? 0.7 : 1,
        transition: `border-color ${TOKENS.duration} ${TOKENS.easing}, background-color ${TOKENS.duration} ${TOKENS.easing}`,
        '&:hover': disabled
          ? {}
          : {
              borderColor: selected ? TOKENS.primary : TOKENS.primaryEdge,
              backgroundColor: selected ? TOKENS.primarySoft : 'rgba(92, 203, 245, 0.04)',
            },
        '&:active': disabled ? {} : { transform: 'scale(0.99)' },
        '&:focus-visible': { outline: `2px solid ${TOKENS.primary}`, outlineOffset: 2 },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{ color: disabled ? TOKENS.textSubtle : TOKENS.ink }}
        >
          {choice.title}
        </Typography>
        {choice.badge && <Chip label={choice.badge} size="small" />}
      </Stack>

      {/* Indicatorul e decorativ: starea reală o comunică `aria-checked` pe container. */}
      <Box
        aria-hidden
        sx={{
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: '50%',
          border: `1.5px solid ${selected ? TOKENS.primary : TOKENS.borderHover}`,
          display: 'grid',
          placeItems: 'center',
          transition: `border-color ${TOKENS.duration} ${TOKENS.easing}`,
        }}
      >
        {selected && (
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: TOKENS.primary }} />
        )}
      </Box>
    </Stack>
  )

  return disabled && choice.disabledReason ? (
    <Tooltip title={choice.disabledReason}>
      <Box>{option}</Box>
    </Tooltip>
  ) : (
    option
  )
}
