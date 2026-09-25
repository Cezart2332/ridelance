import { useState, type FormEvent } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Link, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthSwitchLink } from './shell/AuthSwitchLink'
import { IS_NATIVE_APP } from '../../native/platform'
import { curtain } from '../../native/launch/curtainStore'
import { NativeLoginButton } from '../../native/launch/NativeLoginButton'
import { PasswordField } from './shell/PasswordField'
import { TrustRow } from './shell/TrustRow'
import { AUTH_COLORS, AUTH_DENSITY, authInputSx, authPrimaryButtonSx } from './shell/authShellSx'
import { mapAuthError, validateEmail, validateLoginPassword, type AuthErrorInfo } from './authValidation'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'
import { loginDestination } from './loginDestination'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [serverError, setServerError] = useState<AuthErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Validăm la blur doar câmpurile completate; cele goale se validează la trimitere.
  // După prima validare, mesajul se actualizează pe măsură ce utilizatorul corectează valoarea.
  const emailError = touched.email ? validateEmail(email) : null
  const passwordError = touched.password ? validateLoginPassword(password) : null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    // Butonul din aplicație rămâne apăsabil cât se încarcă (e pastila cu puncte), deci garda e aici.
    if (isLoading) return
    setTouched({ email: true, password: true })
    setServerError(null)

    if (validateEmail(email) || validateLoginPassword(password)) return

    setIsLoading(true)
    try {
      const { role } = await authService.login(email.trim(), password)
      // În aplicație, cortina coboară din antet și acoperă ecranul; urcă înapoi peste dashboard.
      if (IS_NATIVE_APP) await curtain.cover()
      navigate(loginDestination(location.state?.returnTo, role), { replace: true })
    } catch (err) {
      setServerError(mapAuthError(err, 'login'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout accountForm>
      <AuthFormHeader
        title="Bine ai revenit"
        subtitle={
          // Contul se creează pe site, odată cu înrolarea — aplicația e doar pentru conturile active.
          IS_NATIVE_APP ? 'Intră în contul tău RIDElance.' : (
            <AuthSwitchLink prompt="Nu ai încă un cont?" linkLabel="Creează cont" to={ROUTES.register} />
          )
        }
        error={serverError?.message}
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack sx={AUTH_DENSITY.betweenFields}>
          <TextField
            fullWidth
            hiddenLabel
            // În aplicație, focusul din prima clipă deschide tastatura peste animația de pornire.
            autoFocus={!IS_NATIVE_APP}
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, email: current.email || Boolean(email.trim()) }))}
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
            onBlur={() => setTouched((current) => ({ ...current, password: current.password || Boolean(password) }))}
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

        {IS_NATIVE_APP ? (
          <NativeLoginButton loading={isLoading} sx={AUTH_DENSITY.metaToCta} />
        ) : (
          <Button
            type="submit"
            variant="contained"
            fullWidth
            loading={isLoading}
            sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}
          >
            Intră în RIDElance
          </Button>
        )}
      </Box>

      <TrustRow />
    </AuthLayout>
  )
}
