import { useEffect, useState, type FormEvent } from 'react'
import { Box, Button, Link, Stack } from '@mui/material'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import { ROUTES } from '../../constants/routes'
import { authService, type TwoFactorChallenge } from '../../services/auth.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { PasswordField } from './shell/PasswordField'
import { AUTH_DENSITY, authPrimaryButtonSx } from './shell/authShellSx'
import { TwoFactorStep } from './TwoFactorStep'

const MIN_PASSWORD = 10

type Invitation = { fullName: string; email: string; role: string }

/**
 * Contul de echipă din invitație: parola, apoi 2FA obligatoriu. Fără 2FA configurat contul nu
 * primește sesiune.
 */
export default function StaffInvitationPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null)

  useEffect(() => {
    let active = true
    authService
      .getStaffInvitation(token)
      .then((value) => active && setInvitation(value))
      .catch(() => active && setInvalid(true))
    return () => {
      active = false
    }
  }, [token])

  const passwordError = touched && password.length < MIN_PASSWORD ? `Cel puțin ${MIN_PASSWORD} caractere.` : null
  const confirmError = touched && confirm !== password ? 'Parolele nu coincid.' : null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (busy || password.length < MIN_PASSWORD || confirm !== password) return
    setBusy(true)
    setError(null)
    try {
      setChallenge(await authService.acceptStaffInvitation(token, password))
    } catch (cause) {
      setError(getErrorMessage(cause, 'Contul nu a putut fi creat.'))
    } finally {
      setBusy(false)
    }
  }

  if (challenge) {
    return (
      <AuthLayout accountForm>
        <TwoFactorStep
          challenge={challenge}
          onDone={(session) => navigate(session.role === 'Admin' ? '/admin' : '/contabil', { replace: true })}
          onRestart={() => navigate(ROUTES.login, { replace: true })}
        />
      </AuthLayout>
    )
  }

  if (invalid) {
    return (
      <AuthLayout accountForm>
        <AuthFormHeader title="Invitație expirată" subtitle="Linkul a fost folosit, a expirat sau a fost retras. Cere o invitație nouă." />
        <Link component={RouterLink} to={ROUTES.login} underline="hover" sx={{ fontWeight: 600 }}>
          Mergi la autentificare
        </Link>
      </AuthLayout>
    )
  }

  const role = invitation?.role === 'Admin' ? 'administrator' : 'contabil'
  return (
    <AuthLayout accountForm>
      <AuthFormHeader
        title={invitation ? `Bun venit, ${invitation.fullName.split(' ')[0]}` : 'Invitație'}
        subtitle={invitation ? `Cont de ${role} pentru ${invitation.email}` : 'Se verifică invitația…'}
        error={error ?? undefined}
      />
      <Box component="form" onSubmit={submit} noValidate>
        <Stack sx={AUTH_DENSITY.betweenFields}>
          <PasswordField
            label="Parolă"
            placeholder="Parolă nouă"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            onBlur={() => setTouched(Boolean(password))}
            disabled={busy || !invitation}
            error={passwordError}
            showStrength
          />
          <PasswordField
            label="Confirmă parola"
            placeholder="Confirmă parola"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            onBlur={() => setTouched(Boolean(confirm))}
            disabled={busy || !invitation}
            error={confirmError}
          />
        </Stack>
        <Button type="submit" variant="contained" fullWidth loading={busy} disabled={!invitation} sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}>
          Continuă
        </Button>
      </Box>
    </AuthLayout>
  )
}
