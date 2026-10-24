import { useEffect, useState, type FormEvent } from 'react'
import { Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { authService } from '../../services/auth.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { ROUTES } from '../../constants/routes'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthSwitchLink } from './shell/AuthSwitchLink'
import { CodeInput } from './shell/CodeInput'
import { PasswordField } from './shell/PasswordField'
import { AUTH_COLORS, AUTH_DENSITY, authInputSx, authPrimaryButtonSx } from './shell/authShellSx'
import { validateEmail, validateNewPassword, validatePasswordConfirmation } from './authValidation'

/** Aceleași valori ca `Domain/Users/PasswordReset.cs`. */
const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

type Step = 'email' | 'reset'

/**
 * Parola uitată, în doi pași: adresa, apoi codul primit pe email împreună cu parola nouă.
 *
 * Primul pas spune același lucru oricare ar fi adresa: un mesaj diferit pentru o adresă fără cont
 * ar fi transformat formularul într-o listă a celor înregistrați.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [digits, setDigits] = useState(() => Array<string>(CODE_LENGTH).fill(''))
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [touched, setTouched] = useState({ password: false, confirmation: false })
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const emailError = emailTouched ? validateEmail(email) : null
  const passwordError = touched.password ? validateNewPassword(password) : null
  const confirmationError = touched.confirmation ? validatePasswordConfirmation(password, confirmation) : null

  const sendCode = async () => {
    setError(null)
    setNotice(null)
    setIsLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setStep('reset')
      setNotice(`Dacă există un cont pentru ${email.trim()}, am trimis acolo un cod din ${CODE_LENGTH} cifre.`)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut trimite codul. Încearcă din nou în câteva momente.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmail = (event: FormEvent) => {
    event.preventDefault()
    setEmailTouched(true)
    if (validateEmail(email)) return
    void sendCode()
  }

  const handleReset = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ password: true, confirmation: true })
    const code = digits.join('')
    if (code.length !== CODE_LENGTH) {
      setError(`Introdu codul din ${CODE_LENGTH} cifre primit pe email.`)
      return
    }
    if (validateNewPassword(password) || validatePasswordConfirmation(password, confirmation)) return

    setError(null)
    setIsLoading(true)
    try {
      await authService.resetPassword(email.trim(), code, password)
      navigate(ROUTES.login, { replace: true, state: { notice: 'Parola a fost schimbată. Autentifică-te cu parola nouă.' } })
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut schimba parola. Verifică codul și încearcă din nou.'))
      setIsLoading(false)
    }
  }

  const header = (
    <AuthFormHeader
      title="Resetare parolă"
      subtitle={<AuthSwitchLink prompt="Ți-ai amintit parola?" linkLabel="Autentifică-te" to={ROUTES.login} />}
      error={error}
    />
  )

  if (step === 'email') {
    return (
      <AuthLayout>
        {header}
        <Box component="form" onSubmit={handleEmail} noValidate>
          <TextField
            fullWidth
            hiddenLabel
            autoFocus
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setEmailTouched(true)}
            disabled={isLoading}
            error={Boolean(emailError)}
            helperText={emailError}
            slotProps={{ htmlInput: { 'aria-label': 'Email', 'aria-required': true } }}
            sx={authInputSx}
          />
          <Button type="submit" variant="contained" fullWidth loading={isLoading} sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}>
            Trimite codul
          </Button>
        </Box>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {header}
      <Box component="form" onSubmit={handleReset} noValidate>
        {notice && (
          <Typography variant="body2" sx={{ mb: 2, color: AUTH_COLORS.textMuted }} role="status">
            {notice}
          </Typography>
        )}

        <CodeInput digits={digits} onChange={setDigits} disabled={isLoading} autoFocus />

        <Stack sx={{ mt: 2.5, ...AUTH_DENSITY.betweenFields }}>
          <PasswordField
            label="Parola nouă"
            placeholder="Parola nouă"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            disabled={isLoading}
            error={passwordError}
            showStrength
          />
          <PasswordField
            label="Repetă parola"
            placeholder="Repetă parola"
            autoComplete="new-password"
            value={confirmation}
            onChange={setConfirmation}
            onBlur={() => setTouched((current) => ({ ...current, confirmation: true }))}
            disabled={isLoading}
            error={confirmationError}
          />
        </Stack>

        <Button type="submit" variant="contained" fullWidth loading={isLoading} sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}>
          Schimbă parola
        </Button>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 2.5, justifyContent: 'center' }}>
        <Link
          component="button"
          type="button"
          underline="hover"
          disabled={cooldown > 0 || isLoading}
          onClick={() => void sendCode()}
          sx={{ color: cooldown > 0 ? AUTH_COLORS.textMuted : AUTH_COLORS.primary, fontWeight: 600, fontSize: '0.9rem' }}
        >
          {cooldown > 0 ? `Retrimite codul în ${cooldown}s` : 'Retrimite codul'}
        </Link>
        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={() => {
            setStep('email')
            setError(null)
            setNotice(null)
          }}
          sx={{ color: AUTH_COLORS.primary, fontWeight: 600, fontSize: '0.9rem' }}
        >
          Altă adresă
        </Link>
      </Stack>
    </AuthLayout>
  )
}
