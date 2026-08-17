import { Box } from '@mui/material'
import { useRef, type KeyboardEvent } from 'react'

import type { ChoiceDef } from '../microStepTypes'
import { ChoiceOption } from './ChoiceOption'

interface ChoiceGroupProps {
  label: string
  choices: ChoiceDef[]
  value: string | null
  onChange: (value: string) => void
}

const PREVIOUS = ['ArrowUp', 'ArrowLeft']
const NEXT = ['ArrowDown', 'ArrowRight']

/**
 * Grup de opțiuni sub formă de carduri. Nu `RadioGroup` din MUI: avem nevoie de suprafețe mari,
 * cu titlu și subtitlu, nu de un punct lângă o etichetă.
 *
 * Semantica rămâne însă de radiogroup, cu tot ce implică: săgețile mută selecția (nu doar focusul,
 * ca la radio-urile native), Space/Enter confirmă, iar `aria-checked` spune adevărul.
 */
export function ChoiceGroup({ label, choices, value, onChange }: ChoiceGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const focusOption = (index: number) => {
    const options = containerRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')
    options?.[index]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (![...PREVIOUS, ...NEXT].includes(event.key)) return
    event.preventDefault()

    const currentIndex = choices.findIndex((c) => c.value === value)
    const step = NEXT.includes(event.key) ? 1 : -1
    // Fără selecție încă: prima săgeată aterizează pe prima opțiune, indiferent de direcție.
    let nextIndex =
      currentIndex < 0
        ? step > 0
          ? 0
          : choices.length - 1
        : (currentIndex + step + choices.length) % choices.length

    // Variantele dezactivate se sar la navigarea cu tastatura: rămân vizibile, dar nu selectabile.
    for (let i = 0; i < choices.length && choices[nextIndex].disabled; i++) {
      nextIndex = (nextIndex + step + choices.length) % choices.length
    }
    if (choices[nextIndex].disabled) return

    onChange(choices[nextIndex].value)
    focusOption(nextIndex)
  }

  return (
    <Box
      ref={containerRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(choices.length, 2)}, 1fr)` },
      }}
    >
      {choices.map((choice) => (
        <ChoiceOption
          key={choice.value}
          choice={choice}
          selected={choice.value === value}
          // Un singur tab-stop pentru tot grupul, ca la radio-urile native.
          tabIndex={choice.value === value || (value === null && choice === choices[0]) ? 0 : -1}
          onSelect={() => onChange(choice.value)}
        />
      ))}
    </Box>
  )
}
