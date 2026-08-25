import { useState, type FormEvent } from 'react'
import { Box, Button, FormHelperText, Link, Stack, TextField } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthTabs } from './shell/AuthTabs'
import { AuthAltAction } from './shell/AuthAltAction'
import { PasswordField } from './shell/PasswordField'
import { TrustRow } from './shell/TrustRow'
import { AUTH_CTA_HEIGHT, AUTH_DENSITY, authInputSx } from './shell/authShellSx'
import { AccountTypeChoice, type AccountType } from './shell/AccountTypeChoice'
import {
  mapAuthError,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validateTerms,
  type AuthErrorInfo,
} from './authValidation'
import { TermsAcceptance } from '../common/TermsAcceptance'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'
import { SRL_ROOT } from '../../config/srlNavigation'

interface RegisterPageProps {
  /**
   * `CarPoster` e servit de `/inregistrare/anunturi`. Restul lumii ajunge pe `/inregistrare` și
   * primește rolul implicit — tipul de PFA și restul datelor se decid în onboarding, nu aici.
   */
  role?: 'Client' | 'CarPoster'
}

export default function RegisterPage({ role = 'Client' }: RegisterPageProps) {
  const navigate = useNavigate()
  // Ruta doar preselectează; alegerea rămâne a utilizatorului, vizibilă în formular.
  const [accountType, setAccountType] = useState<AccountType>(role)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, terms: false })
  const [serverError, setServerError] = useState<AuthErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Numele se cere doar pentru conturile de flotă.
   *
   * PFA-ul încarcă buletinul la primul pas al onboardingului, iar OCR-ul completează numele pe
   * cont de acolo (`ExtractedFieldApplier.ApplyToUserAsync`). Cerut și aici, ar fi al doilea loc
   * din care poate veni aceeași informație — adică exact sursa de adevăr dublă pe care fluxul
   * document-first o desființează. Flota nu are buletin de încărcat, deci acolo rămâne.
   */
  const needsFullName = accountType === 'CarPoster'

  const fullNameError = needsFullName && touched.fullName ? validateFullName(fullName) : null
  const emailError = touched.email ? validateEmail(email) : null
  const passwordError = touched.password ? validateNewPassword(password) : null
  const termsError = touched.terms ? validateTerms(termsAccepted) : null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ fullName: true, email: true, password: true, terms: true })
    setServerError(null)

    if (
      (needsFullName && validateFullName(fullName)) ||
      validateEmail(email) ||
      validateNewPassword(password) ||
      validateTerms(termsAccepted)
    ) {
      return
    }

    setIsLoading(true)
    try {
      const trimmedEmail = email.trim()
      await authService.register(
        trimmedEmail,
        password,
        accountType,
        needsFullName ? fullName : undefined,
      )
      await authService.login(trimmedEmail, password)
      // Confirmarea adresei se cere înaintea oricărui alt pas. Destinația de după ea se decide
      // aici, unde se știe tipul de cont: flota merge în dashboardul ei, PFA-ul în onboarding.
      navigate(ROUTES.verifyEmail, {
        replace: true,
        state: { email: trimmedEmail, next: accountType === 'CarPoster' ? SRL_ROOT : '/app' },
      })
    } catch (err) {
      setServerError(mapAuthError(err, 'register'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthFormHeader
        title="Creează-ți contul."
        subtitle="Alege tipul de cont, iar RIDElance îți pregătește experiența potrivită."
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

      <AuthTabs active="register" />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack sx={AUTH_DENSITY.betweenFields}>
          <AccountTypeChoice value={accountType} onChange={setAccountType} disabled={isLoading} />

          {needsFullName && (
            <TextField
              fullWidth
              required
              autoFocus
              label="Nume complet"
              placeholder="Numele tău"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
              disabled={isLoading}
              error={Boolean(fullNameError)}
              helperText={fullNameError}
              sx={authInputSx}
            />
          )}

          <TextField
            fullWidth
            required
            autoFocus={!needsFullName}
            type="email"
            label="Email"
            placeholder="nume@email.ro"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            disabled={isLoading}
            error={Boolean(emailError)}
            helperText={emailError}
            sx={authInputSx}
          />

          <PasswordField
            label="Parolă"
            placeholder="Introdu parola"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            disabled={isLoading}
            error={passwordError}
            showStrength
          />
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
          size="large"
          fullWidth
          loading={isLoading}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ ...AUTH_DENSITY.metaToCta, minHeight: AUTH_CTA_HEIGHT }}
        >
          Creează contul
        </Button>
      </Box>

      <AuthAltAction prompt="Ai deja un cont?" linkLabel="Autentifică-te" to={ROUTES.login} />

      <TrustRow />
    </AuthLayout>
  )
}
