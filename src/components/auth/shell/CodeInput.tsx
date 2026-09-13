import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Stack, TextField } from '@mui/material'
import { AUTH_COLORS } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'

interface CodeInputProps {
  digits: string[]
  onChange: (digits: string[]) => void
  disabled?: boolean
  autoFocus?: boolean
  /** Prefixul numelui accesibil, ca două coduri pe același ecran să nu aibă aceleași etichete. */
  labelPrefix?: string
}

/**
 * Căsuțele pentru un cod de confirmare.
 *
 * Câte o căsuță pe cifră: codul vine din email sau SMS în cifre separate, iar lipirea lui
 * completează toate căsuțele deodată. Fiecare tastă mută focalizarea mai departe, `Backspace` pe
 * o căsuță goală o mută înapoi — altfel corectarea unei cifre cere mouse-ul.
 */
export function CodeInput({ digits, onChange, disabled, autoFocus, labelPrefix = 'Cifra' }: CodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const length = digits.length

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const updated = [...digits]
    updated[index] = digit
    onChange(updated)
    if (digit && index < length - 1) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return

    event.preventDefault()
    const updated = Array<string>(length).fill('')
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i]
    onChange(updated)
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <Stack direction="row" spacing={1.2} sx={{ justifyContent: 'space-between' }}>
      {digits.map((digit, index) => (
        <TextField
          key={index}
          value={digit}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          inputRef={(element: HTMLInputElement | null) => {
            inputsRef.current[index] = element
          }}
          slotProps={{
            htmlInput: {
              inputMode: 'numeric',
              autoComplete: index === 0 ? 'one-time-code' : 'off',
              'aria-label': `${labelPrefix} ${index + 1} din ${length}`,
              style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, padding: '12px 0' },
            },
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: `${TOKENS.radius.md}px`,
              backgroundColor: AUTH_COLORS.input,
              color: AUTH_COLORS.text,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: AUTH_COLORS.border },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: AUTH_COLORS.primary, borderWidth: 1 },
            },
          }}
        />
      ))}
    </Stack>
  )
}
