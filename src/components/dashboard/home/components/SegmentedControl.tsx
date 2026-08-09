import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

import { HOME_TOKENS } from '../tokens'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  /** Punct colorat pentru platforme — culoarea nu e niciodată singurul purtător de informație. */
  dot?: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: readonly SegmentOption<T>[]
  onChange: (value: T) => void
  /** Randat după segmente, în interiorul aceluiași grup (ex. selectorul de interval). */
  trailing?: ReactNode
}

/**
 * Grup de radio-uri navigabil cu tastatura (`role="radiogroup"`, săgeți native prin Tab
 * + Space/Enter), stilizat ca segmented control.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  trailing,
}: SegmentedControlProps<T>) {
  const currentIndex = options.findIndex((option) => option.value === value)

  const moveFocus = (direction: 1 | -1) => {
    const next = options[(currentIndex + direction + options.length) % options.length]
    if (next) onChange(next.value)
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, maxWidth: '100%', flexWrap: 'wrap', rowGap: 1 }}>
      <Box
        role="radiogroup"
        aria-label={label}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault()
            moveFocus(1)
          }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault()
            moveFocus(-1)
          }
        }}
        sx={{
          display: 'flex',
          // Se pliază pe mai multe rânduri când nu are loc, în loc să împingă pagina.
          flexWrap: 'wrap',
          maxWidth: '100%',
          gap: '2px',
          p: '3px',
          borderRadius: '10px',
          bgcolor: HOME_TOKENS.bg.surface,
          border: `1px solid ${HOME_TOKENS.border.subtle}`,
        }}
      >
        {options.map((option) => {
          const selected = option.value === value
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || currentIndex === -1 ? 0 : -1}
              onClick={() => onChange(option.value)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.7,
                // §3.1: 6px 14px, colț de 8px — o pastilă, nu un buton de bară.
                px: '14px',
                py: '6px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                // Selecția se citește ca o suprafață ridicată, nu ca un fundal albastru plin:
                // trei grupuri de filtre pline de accent ar concura cu datele de dedesubt.
                bgcolor: selected ? HOME_TOKENS.bg.app : 'transparent',
                boxShadow: selected ? HOME_TOKENS.shadow.raised : 'none',
                transition: 'background-color 180ms ease-out, color 180ms ease-out',
                '&:hover': selected
                  ? undefined
                  : { '& .MuiTypography-root': { color: HOME_TOKENS.text.primary } },
                '&:focus-visible': {
                  outline: `2px solid ${HOME_TOKENS.brand[600]}`,
                  outlineOffset: 2,
                },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              {option.dot && (
                <Box
                  aria-hidden
                  sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: option.dot, flexShrink: 0 }}
                />
              )}
              <Typography
                component="span"
                sx={{
                  fontSize: '0.81rem',
                  fontWeight: selected ? 600 : 500,
                  whiteSpace: 'nowrap',
                  color: selected ? HOME_TOKENS.text.primary : HOME_TOKENS.text.secondary,
                  transition: 'color 180ms ease-out',
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              >
                {option.label}
              </Typography>
            </Box>
          )
        })}
      </Box>
      {trailing}
    </Stack>
  )
}
