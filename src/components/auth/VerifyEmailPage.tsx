import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Box, Button, Link, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'

import { authService } from '../../services/auth.service'
import { userService } from '../../services/user.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthLayout } from './shell/AuthLayout'
import { CodeInput } from './shell/CodeInput'
import { AUTH_COLORS, AUTH_DENSITY, authPrimaryButtonSx } from './shell/authShellSx'
import { EMAIL_VERIFICATION, PHONE_VERIFICATION } from './emailVerification'

/**
 * Confirmarea contului nou, în doi pași: codul din email, apoi codul din SMS.
 *
 * Telefonul vine al doilea fiindcă SMS-ul cere sesiune (`users/phone/send-code` e autorizat), iar
 * sesiunea există deja — pagina de înregistrare face login înainte să trimită aici.
 *
 * **Niciuna dintre confirmări nu blochează accesul.** Vezi `emailVerification.ts` pentru ce anume nu
 * e impus și ce ar trebui schimbat ca să devină obligatorii.
 */

interface LocationState {
  email?: string
  /** Numărul scris la înregistrare. Lipsește dacă s-a ajuns aici din alt flux. */
  phone?: string
  /** Unde se merge după confirmare. Vine din pagina de înregistrare, care știe tipul de cont. */
  next?: string
}

type Step = 'email' | 'phone'

const emptyCode = (length: number) => Array<string>(length).fill('')

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  const email = state.email ?? ''
  const phone = state.phone ?? ''
  const next = state.next ?? '/app'

  const [step, setStep] = useState<Step>('email')
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  // Fără adresă nu există ce confirma: cineva a ajuns direct pe rută.
  useEffect(() => {
    if (!email) navigate('/app', { replace: true })
  }, [email, navigate])

  const finishEmail = (confirmed: boolean) => {
    setEmailConfirmed(confirmed)
    if (phone) setStep('phone')
    else navigate(next, { replace: true })
  }

  return (
    <AuthLayout>
      <StepIndicator step={step} emailConfirmed={emailConfirmed} hasPhone={Boolean(phone)} />
      {step === 'email' ? (
        <EmailStep email={email} onDone={finishEmail} />
      ) : (
        <PhoneStep phone={phone} onDone={() => navigate(next, { replace: true })} />
      )}
    </AuthLayout>
  )
}

function StepIndicator({ step, emailConfirmed, hasPhone }: { step: Step; emailConfirmed: boolean; hasPhone: boolean }) {
  if (!hasPhone) return null

  const items = [
    { key: 'email', label: 'Email', done: step === 'phone' && emailConfirmed },
    { key: 'phone', label: 'Telefon', done: false },
  ]

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
      {items.map((item, index) => {
        const current = item.key === step
        return (
          <Stack key={item.key} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {index > 0 && <Box sx={{ width: 28, height: 1, backgroundColor: AUTH_COLORS.borderStrong }} />}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: current ? AUTH_COLORS.onPrimary : AUTH_COLORS.textMuted,
                backgroundColor: current ? AUTH_COLORS.primary : AUTH_COLORS.input,
              }}
            >
              {item.done && <CheckCircleRoundedIcon sx={{ fontSize: 15, color: AUTH_COLORS.primary }} />}
              {index + 1}. {item.label}
            </Box>
          </Stack>
        )
      })}
    </Stack>
  )
}

function useCooldown() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (seconds <= 0) return
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])
  return [seconds, setSeconds] as const
}

function EmailStep({ email, onDone }: { email: string; onDone: (confirmed: boolean) => void }) {
  const [digits, setDigits] = useState(() => emptyCode(EMAIL_VERIFICATION.codeLength))
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useCooldown()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsLoading(true)

    try {
      await authService.verifyEmail(email, digits.join(''))
      onDone(true)
    } catch {
      if (EMAIL_VERIFICATION.required) {
        setError('Codul introdus nu este corect sau a expirat.')
        setIsLoading(false)
        return
      }
      onDone(false)
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
    <>
      <AuthFormHeader
        title="Confirmă-ți adresa"
        subtitle={`Am trimis un cod din ${EMAIL_VERIFICATION.codeLength} cifre la ${email}. Introdu-l mai jos.`}
        error={error}
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <CodeInput digits={digits} onChange={setDigits} disabled={isLoading} autoFocus />

        {notice && (
          <Typography variant="body2" sx={{ mt: 2, color: AUTH_COLORS.textMuted }} role="status">
            {notice}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          loading={isLoading}
          sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}
        >
          Confirmă adresa
        </Button>
      </Box>

      <ResendRow cooldown={cooldown} onResend={() => void handleResend()} />

      {!EMAIL_VERIFICATION.required && <SkipLink onClick={() => onDone(false)} />}
    </>
  )
}

function PhoneStep({ phone, onDone }: { phone: string; onDone: () => void }) {
  const [digits, setDigits] = useState(() => emptyCode(PHONE_VERIFICATION.codeLength))
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useCooldown()
  const sentRef = useRef(false)

  const send = async () => {
    setError(null)
    setNotice(null)
    try {
      await userService.sendPhoneCode(phone)
      setNotice(`Am trimis codul prin SMS la ${phone}.`)
      setCooldown(PHONE_VERIFICATION.resendCooldownSeconds)
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut trimite SMS-ul. Încearcă din nou în câteva momente.'))
    }
  }

  // SMS-ul pleacă singur la intrarea în pas. `ref`, nu doar efect: în StrictMode efectul rulează
  // de două ori în dezvoltare, iar fiecare SMS costă.
  useEffect(() => {
    if (sentRef.current) return
    sentRef.current = true
    void send()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsLoading(true)

    try {
      await userService.confirmPhone(digits.join(''))
      onDone()
    } catch {
      if (PHONE_VERIFICATION.required) {
        setError('Codul introdus nu este corect sau a expirat.')
        setIsLoading(false)
        return
      }
      onDone()
    }
  }

  return (
    <>
      <AuthFormHeader
        title="Confirmă-ți telefonul"
        subtitle={`Introdu codul din ${PHONE_VERIFICATION.codeLength} cifre primit prin SMS la ${phone}.`}
        error={error}
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <CodeInput digits={digits} onChange={setDigits} disabled={isLoading} autoFocus labelPrefix="Cifra SMS" />

        {notice && (
          <Typography variant="body2" sx={{ mt: 2, color: AUTH_COLORS.textMuted }} role="status">
            {notice}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          loading={isLoading}
          sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}
        >
          Confirmă telefonul
        </Button>
      </Box>

      <ResendRow cooldown={cooldown} onResend={() => void send()} />

      {!PHONE_VERIFICATION.required && <SkipLink onClick={onDone} />}
    </>
  )
}

function ResendRow({ cooldown, onResend }: { cooldown: number; onResend: () => void }) {
  return (
    <Box sx={{ ...AUTH_DENSITY.ctaToFooter, textAlign: 'center' }}>
      <Typography variant="body2" component="span" sx={{ color: AUTH_COLORS.textMuted }}>
        Nu ai primit codul?{' '}
      </Typography>
      <Link
        component="button"
        type="button"
        onClick={onResend}
        disabled={cooldown > 0}
        underline="hover"
        variant="body2"
        sx={{ fontWeight: 600, color: cooldown > 0 ? AUTH_COLORS.textSubtle : AUTH_COLORS.primary }}
      >
        {cooldown > 0 ? `Retrimite în ${cooldown}s` : 'Retrimite'}
      </Link>
    </Box>
  )
}

function SkipLink({ onClick }: { onClick: () => void }) {
  return (
    <Box sx={{ mt: 1.5, textAlign: 'center' }}>
      <Link
        component="button"
        type="button"
        onClick={onClick}
        underline="hover"
        variant="body2"
        sx={{ color: AUTH_COLORS.textSubtle }}
      >
        Continuă
      </Link>
    </Box>
  )
}
