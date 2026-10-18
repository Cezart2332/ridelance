import { Stack } from '@mui/material'
import { useState, type KeyboardEvent, type ReactNode } from 'react'

import { AutoAdvanceFooter } from './micro/AutoAdvanceFooter'

interface AutoContinueProps {
  /** Ecranul e gata (toate câmpurile valide, contul conectat, serverul zice „complet”). */
  ready: boolean
  /** Schimbat, repornește numărătoarea: valorile formularului, serializate. */
  restartKey: string
  onContinue: () => void
  /** Se salvează: nu numărăm și nu pornim nimic. */
  busy?: boolean
  /** Ecranul nu mai poate trece mai departe (dosar blocat, fără pas următor). */
  disabled?: boolean
  /** Ce mai lipsește, cât ecranul nu e gata. */
  reasons?: string[]
  delayMs?: number
  /** Spațiul dintre câmpuri și footer, ca în restul paginii. */
  spacing?: number
  /**
   * Buton „Continuă” în loc de trecerea singură — implicit, pentru că aici sunt formulare. `false`
   * doar pe ecranele fără câmpuri (un cont tocmai conectat).
   */
  manual?: boolean
  children?: ReactNode
}

const isField = (target: EventTarget) =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement

/**
 * Footerul unui formular de onboarding: „Continuă”, activ când formularul e gata; Enter trece
 * imediat. Cu `manual={false}`, ecranul trece singur după o scurtă numărătoare.
 */
export function AutoContinue({
  ready,
  restartKey,
  onContinue,
  busy,
  disabled,
  reasons,
  delayMs = 2000,
  spacing = 3,
  manual = true,
  children,
}: AutoContinueProps) {
  /** Fiecare tastă repornește numărătoarea: plecăm după ce omul se oprește din scris. */
  const [keystrokes, setKeystrokes] = useState(0)
  const [stayedAt, setStayedAt] = useState<string | null>(null)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || !ready || busy || disabled) return
    if (!(event.target instanceof HTMLInputElement)) return
    event.preventDefault()
    onContinue()
  }

  const key = `${restartKey}:${keystrokes}`
  const countdown = ready && !disabled ? { delayMs, restartKey: key, paused: false } : null

  return (
    <Stack
      spacing={spacing}
      onKeyDown={handleKeyDown}
      // Faza de bubble, nu capture: în capture, React re-randa câmpul cu valoarea veche înainte ca
      // `onChange`-ul lui să apuce să citească tasta — și litera dispărea. Aici update-ul e în
      // același lot cu `onChange`.
      onInput={(event) => isField(event.target) && setKeystrokes((k) => k + 1)}
    >
      {children}
      <AutoAdvanceFooter
        reasons={ready ? [] : (reasons ?? [])}
        countdown={countdown}
        stayed={stayedAt === key}
        busy={busy}
        onDone={onContinue}
        onStay={() => setStayedAt(key)}
        manual={manual}
      />
    </Stack>
  )
}
