import { useState, type FormEvent } from 'react'
import { Box, Button, FormHelperText, Link, Stack, TextField } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthSwitchLink } from './shell/AuthSwitchLink'
import { PasswordField } from './shell/PasswordField'
import { TrustRow } from './shell/TrustRow'
import { AUTH_DENSITY, authInputSx, authPrimaryButtonSx } from './shell/authShellSx'
import { AccountTypeChoice, type AccountType } from './shell/AccountTypeChoice'
import {
  mapAuthError,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validatePhone,
  validateTerms,
  type AuthErrorInfo,
} from './authValidation'
import { TermsAcceptance } from '../common/TermsAcceptance'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'
import { SRL_ROOT } from '../../config/srlNavigation'

interface RegisterPageProps {
  /** `CarPoster` e servit de `/inregistrare/anunturi`; ruta doar preselectează SRL. */
  role?: 'Client' | 'CarPoster'
}

const EMPTY_TOUCHED = { email: false, phone: false, password: false, confirmation: false, terms: false }

/**
 * Contul nou: tipul (PFA sau SRL), email, telefon și parola de două ori. Fără nume — la PFA vine
 * din buletin, în onboarding. Emailul și telefonul se confirmă cu coduri imediat după creare, pe
 * pagina de confirmare.
 */
export default function RegisterPage({ role = 'Client' }: RegisterPageProps) {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState<AccountType>(role)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [touched, setTouched] = useState(EMPTY_TOUCHED)
  const [serverError, setServerError] = useState<AuthErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const touch = (field: 'email' | 'phone' | 'password' | 'confirmation') => () => {
    const values = { email: email.trim(), phone: phone.trim(), password, confirmation }
    setTouched((current) => ({ ...current, [field]: current[field] || Boolean(values[field]) }))
  }

  const emailError = touched.email ? validateEmail(email) : null
  const phoneError = touched.phone ? validatePhone(phone) : null
  const passwordError = touched.password ? validateNewPassword(password) : null
  const confirmationError = touched.confirmation ? validatePasswordConfirmation(password, confirmation) : null
  const termsError = touched.terms ? validateTerms(termsAccepted) : null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ email: true, phone: true, password: true, confirmation: true, terms: true })
    setServerError(null)

    if (
      validateEmail(email) ||
      validatePhone(phone) ||
      validateNewPassword(password) ||
      validatePasswordConfirmation(password, confirmation) ||
      validateTerms(termsAccepted)
    ) {
      return
    }

    setIsLoading(true)
    try {
      const trimmedEmail = email.trim()
      const trimmedPhone = phone.trim()
      await authService.register(trimmedEmail, password, accountType, trimmedPhone)
      await authService.login(trimmedEmail, password)
      // Confirmarea se cere înaintea oricărui alt pas. Destinația de după ea se decide aici, unde
      // se știe tipul de cont: SRL-ul merge în dashboardul lui, PFA-ul în onboarding.
      navigate(ROUTES.verifyEmail, {
        replace: true,
        state: {
          email: trimmedEmail,
          phone: trimmedPhone,
          next: accountType === 'CarPoster' ? SRL_ROOT : '/app',
        },
      })
    } catch (err) {
      setServerError(mapAuthError(err, 'register'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout accountForm>
      <AuthFormHeader
        title="Creează-ți contul"
        subtitle={<AuthSwitchLink prompt="Ai deja un cont?" linkLabel="Autentifică-te" to={ROUTES.login} />}
        error={
          serverError && (
            <>
              {serverError.message}
              {serverError.showLoginLink && (
                <>
                  {' '}
                  <Link component={RouterLink} to={ROUTES.login} underline="always">
                    Autentifică-te
                  </Link>
                </>
              )}
            </>
          )
        }
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack sx={AUTH_DENSITY.betweenFields}>
          <AccountTypeChoice value={accountType} onChange={setAccountType} disabled={isLoading} />

          <TextField
            fullWidth
            hiddenLabel
            autoFocus
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={touch('email')}
            disabled={isLoading}
            error={Boolean(emailError)}
            helperText={emailError}
            slotProps={{ htmlInput: { 'aria-label': 'Email', 'aria-required': true } }}
            sx={authInputSx}
          />

          <TextField
            fullWidth
            hiddenLabel
            type="tel"
            placeholder="Telefon"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onBlur={touch('phone')}
            disabled={isLoading}
            error={Boolean(phoneError)}
            helperText={phoneError}
            slotProps={{ htmlInput: { 'aria-label': 'Telefon', 'aria-required': true, inputMode: 'tel' } }}
            sx={authInputSx}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              ...AUTH_DENSITY.betweenFields,
              alignItems: 'start',
            }}
          >
            <PasswordField
              label="Parolă"
              placeholder="Parola"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              onBlur={touch('password')}
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
              onBlur={touch('confirmation')}
              disabled={isLoading}
              error={confirmationError}
            />
          </Box>
        </Stack>

        <Box sx={AUTH_DENSITY.fieldsToMeta}>
          <TermsAcceptance
            checked={termsAccepted}
            disabled={isLoading}
            withPrivacy
            onChange={(checked) => {
              setTermsAccepted(checked)
              setTouched((current) => ({ ...current, terms: true }))
            }}
          />
          {termsError && <FormHelperText error>{termsError}</FormHelperText>}
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          loading={isLoading}
          sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}
        >
          Creează contul
        </Button>
      </Box>

      <TrustRow />
    </AuthLayout>
  )
}
