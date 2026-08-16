import { useState, type FormEvent } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Link, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthAltAction } from './shell/AuthAltAction'
import { PasswordField } from './shell/PasswordField'
import { TrustRow } from './shell/TrustRow'
import { AUTH_CTA_HEIGHT, AUTH_DENSITY, authInputSx } from './shell/authShellSx'
import { mapAuthError, validateEmail, validateLoginPassword, type AuthErrorInfo } from './authValidation'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'
import { TOKENS } from '../../constants/tokens'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [serverError, setServerError] = useState<AuthErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Prima dată validăm la `blur`; după ce câmpul a fost atins, la fiecare tastă. Altfel ar apărea
  // „adresă invalidă" încă de la primul caracter tastat.
  const emailError = touched.email ? validateEmail(email) : null
  const passwordError = touched.password ? validateLoginPassword(password) : null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setServerError(null)

    if (validateEmail(email) || validateLoginPassword(password)) return

    setIsLoading(true)
    try {
      await authService.login(email.trim(), password)
      navigate('/app')
    } catch (err) {
      setServerError(mapAuthError(err, 'login'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthFormHeader
        title="Bine ai revenit"
        subtitle="Autentifică-te ca să continui."
        error={serverError?.message}
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
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            disabled={isLoading}
            error={passwordError}
          />
        </Stack>

        <Stack
          direction="row"
          sx={{ ...AUTH_DENSITY.fieldsToMeta, alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/*
            Backendul fixează cookie-ul de refresh la 7 zile, deci bifa nu schimbă încă nimic;
            devine reală când `Login.cs` primește un `MaxAge` variabil.
          */}
          <FormControlLabel
            control={<Checkbox size="small" disabled={isLoading} />}
            label={
              <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
                Ține-mă minte
              </Typography>
            }
            sx={{ m: 0, gap: 1 }}
          />
          <Link
            component={RouterLink}
            to={ROUTES.forgotPassword}
            underline="hover"
            variant="body2"
            sx={{ fontWeight: 600 }}
          >
            Ai uitat parola?
          </Link>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          loading={isLoading}
          sx={{ ...AUTH_DENSITY.metaToCta, minHeight: AUTH_CTA_HEIGHT }}
        >
          Autentifică-te
        </Button>
      </Box>

      <AuthAltAction prompt="Nu ai cont încă?" linkLabel="Creează cont" to={ROUTES.register} />

      <TrustRow />
    </AuthLayout>
  )
}
