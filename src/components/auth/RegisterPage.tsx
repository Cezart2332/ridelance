import { useState, type FormEvent } from 'react'
import { Box, Button, FormHelperText, Link, Stack, TextField } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthAltAction } from './shell/AuthAltAction'
import { PasswordField } from './shell/PasswordField'
import { TrustRow } from './shell/TrustRow'
import { AUTH_CTA_HEIGHT, AUTH_DENSITY, authInputSx } from './shell/authShellSx'
import {
  mapAuthError,
  validateEmail,
  validateNewPassword,
  validateTerms,
  type AuthErrorInfo,
} from './authValidation'
import { TermsAcceptance } from '../common/TermsAcceptance'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'

interface RegisterPageProps {
  /**
   * `CarPoster` e servit de `/inregistrare/anunturi`. Restul lumii ajunge pe `/inregistrare` și
   * primește rolul implicit — tipul de PFA și restul datelor se decid în onboarding, nu aici.
   */
  role?: 'Client' | 'CarPoster'
}

export default function RegisterPage({ role = 'Client' }: RegisterPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false, terms: false })
  const [serverError, setServerError] = useState<AuthErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const emailError = touched.email ? validateEmail(email) : null
  const passwordError = touched.password ? validateNewPassword(password) : null
  const termsError = touched.terms ? validateTerms(termsAccepted) : null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ email: true, password: true, terms: true })
    setServerError(null)

    if (validateEmail(email) || validateNewPassword(password) || validateTerms(termsAccepted)) return

    setIsLoading(true)
    try {
      const trimmedEmail = email.trim()
      await authService.register(trimmedEmail, password, role)
      await authService.login(trimmedEmail, password)
      navigate(role === 'CarPoster' ? '/poster' : '/app')
    } catch (err) {
      setServerError(mapAuthError(err, 'register'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthFormHeader
        title="Creează-ți contul"
        subtitle={
          role === 'CarPoster'
            ? 'Cont pentru publicarea anunțurilor de închiriere mașini.'
            : 'Îți configurăm contul în câțiva pași după înregistrare.'
        }
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
          <TextField
            fullWidth
            required
            autoFocus
            type="email"
            label="Email"
            placeholder="nume@exemplu.ro"
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
          sx={{ ...AUTH_DENSITY.metaToCta, minHeight: AUTH_CTA_HEIGHT }}
        >
          Continuă
        </Button>
      </Box>

      <AuthAltAction prompt="Ai deja cont?" linkLabel="Autentifică-te" to={ROUTES.login} />

      <TrustRow />
    </AuthLayout>
  )
}
