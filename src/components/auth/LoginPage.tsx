import { useState, type FormEvent } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Link, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthSwitchLink } from './shell/AuthSwitchLink'
import { PasswordField } from './shell/PasswordField'
import { TrustRow } from './shell/TrustRow'
import { AUTH_COLORS, AUTH_DENSITY, authInputSx, authPrimaryButtonSx } from './shell/authShellSx'
import { mapAuthError, validateEmail, validateLoginPassword, type AuthErrorInfo } from './authValidation'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
      const returnTo = location.state?.returnTo
      navigate(typeof returnTo === 'string' && /^\/(app|onboarding-srl|onboarding|admin|contabil)(\/|\?|#|$)/.test(returnTo) && !returnTo.includes('\\') ? returnTo : '/app', { replace: true })
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
        subtitle={<AuthSwitchLink prompt="Nu ai încă un cont?" linkLabel="Creează cont" to={ROUTES.register} />}
        error={serverError?.message}
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack sx={AUTH_DENSITY.betweenFields}>
          <TextField
            fullWidth
            hiddenLabel
            autoFocus
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            disabled={isLoading}
            error={Boolean(emailError)}
            helperText={emailError}
            slotProps={{ htmlInput: { 'aria-label': 'Email', 'aria-required': true } }}
            sx={authInputSx}
          />

          <PasswordField
            label="Parolă"
            placeholder="Parola"
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
            control={
              <Checkbox
                size="small"
                disabled={isLoading}
                sx={{ p: 0.25, color: AUTH_COLORS.textSubtle, '&.Mui-checked': { color: AUTH_COLORS.primary } }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: AUTH_COLORS.textMuted }}>
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
            sx={{ fontWeight: 600, color: AUTH_COLORS.primary }}
          >
            Ai uitat parola?
          </Link>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          loading={isLoading}
          sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}
        >
          Intră în RIDElance
        </Button>
      </Box>

      <TrustRow />
    </AuthLayout>
  )
}
