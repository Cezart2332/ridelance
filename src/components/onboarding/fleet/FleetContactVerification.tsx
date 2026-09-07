import { useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { authService } from '../../../services/auth.service'
import { userService } from '../../../services/user.service'
import type { FleetState } from '../../../services/fleetOnboarding.service'
import { getErrorMessage } from '../../../utils/errorHandler'

export function FleetContactVerification({
  state,
  refresh,
}: {
  state: FleetState
  refresh: () => Promise<void>
}) {
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phone, setPhone] = useState(state.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true)
    setError('')
    try {
      await action()
      await refresh()
      setMessage(message)
    } catch (e) {
      setError(getErrorMessage(e, 'Nu am putut verifica datele.'))
    } finally {
      setBusy(false)
    }
  }
  // Când serverul nu cere confirmarea, ecranul trebuie s-o spună: altfel două câmpuri „de
  // confirmat" care nu blochează nimic arată ca un pas neterminat, iar omul așteaptă un cod.
  const optional = !state.contactVerificationRequired

  return (
    <Stack spacing={2}>
      {optional && (
        <Alert severity="info">
          Confirmarea emailului și a telefonului e opțională deocamdată — poți continua fără ea.
        </Alert>
      )}
      <TextField
        label="Email"
        value={state.email}
        slotProps={{ input: { readOnly: true } }}
        helperText={
          state.emailVerified
            ? '✓ Verificat'
            : optional
              ? 'Confirmarea e opțională'
              : 'Confirmă adresa de email'
        }
      />
      {!state.emailVerified && (
        <Stack spacing={1}>
          <Button
            disabled={busy}
            onClick={() =>
              void run(
                () => authService.resendVerification(state.email),
                'Codul a fost trimis pe email.',
              )
            }
          >
            Trimite codul pe email
          </Button>
          <TextField
            label="Cod email"
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value)}
            autoComplete="one-time-code"
          />
          <Button
            disabled={busy || emailCode.length !== 6}
            onClick={() =>
              void run(
                () => authService.verifyEmail(state.email, emailCode),
                'Email verificat.',
              )
            }
          >
            Confirmă emailul
          </Button>
        </Stack>
      )}
      <TextField
        label="Telefon"
        value={state.phoneVerified ? (state.phone ?? '') : phone}
        onChange={(e) => setPhone(e.target.value)}
        slotProps={{ input: { readOnly: state.phoneVerified } }}
        helperText={
          state.phoneVerified
            ? '✓ Verificat'
            : optional
              ? 'Confirmarea e opțională'
              : 'Confirmă numărul prin SMS'
        }
      />
      {!state.phoneVerified && (
        <Stack spacing={1}>
          <Button
            disabled={busy || !phone.trim()}
            onClick={() =>
              void run(
                () => userService.sendPhoneCode(phone),
                'Codul a fost trimis prin SMS.',
              )
            }
          >
            Trimite codul prin SMS
          </Button>
          <TextField
            label="Cod SMS"
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value)}
            autoComplete="one-time-code"
          />
          <Button
            disabled={busy || phoneCode.length !== 6}
            onClick={() =>
              void run(
                () => userService.confirmPhone(phoneCode),
                'Telefon verificat.',
              )
            }
          >
            Confirmă telefonul
          </Button>
        </Stack>
      )}
      {message && (
        <Typography role="status" color="success.main">
          {message}
        </Typography>
      )}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  )
}
