import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

import { authService } from '../../services/auth.service'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthLayout } from './shell/AuthLayout'
import { AUTH_CTA_HEIGHT, AUTH_DENSITY } from './shell/authShellSx'
import { TOKENS } from '../../constants/tokens'
import { EMAIL_VERIFICATION } from './emailVerification'

/**
 * Pasul de confirmare a adresei, imediat după crearea contului.
 *
 * Șase căsuțe, nu un singur câmp: codul vine din email în cifre separate, iar lipirea lui
 * completează toate căsuțele deodată. Fiecare tastă mută focalizarea mai departe, `Backspace` pe
 * o căsuță goală o mută înapoi — altfel corectarea unei cifre cere mouse-ul.
 *
 * **Confirmarea nu blochează accesul.** Vezi `emailVerification.ts` pentru ce anume nu e impus și
 * ce ar trebui schimbat ca să devină obligatorie.
 */

const LENGTH = EMAIL_VERIFICATION.codeLength

interface LocationState {
  email?: string
  /** Unde se merge după pas. Vine din pagina de înregistrare, care știe tipul de cont. */
  next?: string
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  const email = state.email ?? ''
  const next = state.next ?? '/app'

  const [digits, setDigits] = useState<string[]>(() => Array<string>(LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Fără adresă nu există ce confirma: cineva a ajuns direct pe rută.
  useEffect(() => {
    if (!email) navigate('/app', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setDigits((current) => {
      const updated = [...current]
      updated[index] = digit
      return updated
    })
    if (digit && index < LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  /** Codul lipit din email umple tot, oriunde ar fi cursorul. */
  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!pasted) return

    event.preventDefault()
    const updated = Array<string>(LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i]
    setDigits(updated)
    inputsRef.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
  }

  const code = digits.join('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsLoading(true)

    try {
      await authService.verifyEmail(email, code)
      navigate(next, { replace: true })
    } catch {
      if (EMAIL_VERIFICATION.required) {
        setError('Codul introdus nu este corect sau a expirat.')
        setIsLoading(false)
        return
      }

      navigate(next, { replace: true })
    }
  }

  const handleResend = async () => {
    setError(null)
    setNotice(null)
    try {
      await authService.resendVerification(email)
      setNotice('Am trimis un cod nou. Verifică-ți inboxul.')
      setCooldown(EMAIL_VERIFICATION.resendCooldownSeconds)
    } catch {
      setError('Nu am putut trimite codul. Încearcă din nou în câteva momente.')
    }
  }

  return (
    <AuthLayout>
      <AuthFormHeader
        title="Confirmă-ți adresa."
        subtitle={
          email
            ? `Am trimis un cod din ${LENGTH} cifre la ${email}. Introdu-l mai jos.`
            : `Introdu codul din ${LENGTH} cifre primit pe email.`
        }
        error={error}
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack direction="row" spacing={1.2} sx={{ justifyContent: 'space-between' }}>
          {digits.map((digit, index) => (
            <TextField
              key={index}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={handleKeyDown(index)}
              onPaste={handlePaste}
              autoFocus={index === 0}
              disabled={isLoading}
              inputRef={(element: HTMLInputElement | null) => {
                inputsRef.current[index] = element
              }}
              slotProps={{
                htmlInput: {
                  inputMode: 'numeric',
                  autoComplete: index === 0 ? 'one-time-code' : 'off',
                  'aria-label': `Cifra ${index + 1} din ${LENGTH}`,
                  style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, padding: '12px 0' },
                },
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': { borderRadius: `${TOKENS.radius.md}px` },
              }}
            />
          ))}
        </Stack>

        {notice && (
          <Typography variant="body2" sx={{ mt: 2, color: TOKENS.textMuted }} role="status">
            {notice}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          loading={isLoading}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ ...AUTH_DENSITY.metaToCta, minHeight: AUTH_CTA_HEIGHT }}
        >
          Confirmă adresa
        </Button>
      </Box>

      <Box sx={{ ...AUTH_DENSITY.ctaToDivider, textAlign: 'center' }}>
        <Typography variant="body2" component="span" sx={{ color: TOKENS.textMuted }}>
          Nu ai primit codul?{' '}
        </Typography>
        <Link
          component="button"
          type="button"
          onClick={() => void handleResend()}
          disabled={cooldown > 0}
          underline="hover"
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
          {cooldown > 0 ? `Retrimite în ${cooldown}s` : 'Retrimite'}
        </Link>
      </Box>

      {!EMAIL_VERIFICATION.required && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            onClick={() => navigate(next, { replace: true })}
            underline="hover"
            variant="body2"
            sx={{ color: TOKENS.textMuted }}
          >
            Continuă
          </Link>
        </Box>
      )}
    </AuthLayout>
  )
}
