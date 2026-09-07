import { useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { userService } from '../../../services/user.service'
import type { FleetState } from '../../../services/fleetOnboarding.service'
import { getErrorMessage } from '../../../utils/errorHandler'

/**
 * Datele de contact ale administratorului.
 *
 * Emailul se arată, nu se editează și nu se mai confirmă aici: e adresa contului, confirmată la
 * înregistrare, iar o a doua confirmare în onboarding cerea încă un cod pentru ceva deja dovedit.
 * Schimbarea ei trece prin suport, nu printr-un câmp de pe un pas de configurare.
 *
 * Rămâne telefonul, care chiar e nou față de cont — și acela opțional cât timp furnizorul de SMS
 * nu e configurat.
 */
export function FleetContactVerification({
  state,
  refresh,
}: {
  state: FleetState
  refresh: () => Promise<void>
}) {
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
  // Când serverul nu cere confirmarea, ecranul trebuie s-o spună: un câmp „de confirmat" care nu
  // blochează nimic arată ca un pas neterminat, iar omul așteaptă un cod care nu vine.
  const optional = !state.contactVerificationRequired

  return (
    <Stack spacing={2}>
      {optional && (
        <Alert severity="info">
          Confirmarea telefonului e opțională deocamdată — poți continua fără ea.
        </Alert>
      )}

      {/* `disabled` pe lângă `readOnly`: fără el câmpul arată exact ca unul editabil și invită
          la tastat, deși nu primește nimic. */}
      <TextField
        label="Email"
        value={state.email}
        disabled
        slotProps={{ input: { readOnly: true } }}
        helperText="Adresa contului. Se schimbă prin suport."
      />

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
