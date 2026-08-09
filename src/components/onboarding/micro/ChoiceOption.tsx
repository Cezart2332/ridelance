import { Box, Typography } from '@mui/material'
import type { KeyboardEvent } from 'react'

import type { ChoiceDef } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'

interface ChoiceOptionProps {
  choice: ChoiceDef
  selected: boolean
  tabIndex: number
  onSelect: () => void
}

export function ChoiceOption({ choice, selected, tabIndex, onSelect }: ChoiceOptionProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    onSelect()
  }

  return (
    <Box
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      sx={{
        position: 'relative',
        p: 2.5,
        pr: 5.5,
        cursor: 'pointer',
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1.5px solid ${selected ? TOKENS.primary : TOKENS.border}`,
        backgroundColor: selected ? TOKENS.primarySoft : TOKENS.paper,
        transition: `border-color ${TOKENS.duration} ${TOKENS.easing}, background-color ${TOKENS.duration} ${TOKENS.easing}`,
        '&:hover': {
          borderColor: selected ? TOKENS.primary : TOKENS.primaryEdge,
          backgroundColor: selected ? TOKENS.primarySoft : 'rgba(92, 203, 245, 0.04)',
        },
        '&:active': { transform: 'scale(0.99)' },
        '&:focus-visible': {
          outline: `2px solid ${TOKENS.primary}`,
          outlineOffset: 2,
        },
      }}
    >
      <Typography variant="subtitle2" sx={{ color: TOKENS.ink }}>
        {choice.title}
      </Typography>

      {choice.subtitle && (
        <Typography variant="caption" component="p" sx={{ color: TOKENS.textMuted, mt: 0.5 }}>
          {choice.subtitle}
        </Typography>
      )}

      {/* Indicatorul e decorativ: starea reală o comunică `aria-checked` pe container. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 20,
          height: 20,
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
    </Box>
  )
}
