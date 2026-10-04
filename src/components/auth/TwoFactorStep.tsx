import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import QRCode from 'qrcode'

import { authService, type AuthSession, type TwoFactorChallenge } from '../../services/auth.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AUTH_COLORS, AUTH_DENSITY, authInputSx, authPrimaryButtonSx } from './shell/authShellSx'

/**
 * O singură cerere de configurare per token: efectul rulează de două ori în dev (StrictMode), iar
 * două cereri simultane ar genera două secrete și s-ar ciocni pe același cont.
 */
const setupRequests = new Map<string, Promise<{ secret: string; qr: string }>>()

function requestSetup(challengeToken: string) {
  let request = setupRequests.get(challengeToken)
  if (!request) {
    request = authService.startTwoFactorSetup(challengeToken).then(async ({ secret, qrText }) => ({
      secret,
      qr: await QRCode.toDataURL(qrText, { margin: 1, width: 200 }),
    }))
    setupRequests.set(challengeToken, request)
  }
  return request
}

const monoSx = { fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', letterSpacing: '0.06em' }

function CodeField({ value, onChange, recovery, disabled }: { value: string; onChange: (value: string) => void; recovery: boolean; disabled: boolean }) {
  return (
    <TextField
      fullWidth
      hiddenLabel
      autoFocus
      value={value}
      onChange={(event) => onChange(recovery ? event.target.value : event.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder={recovery ? 'xxxxx-xxxxx' : '000000'}
      autoComplete="one-time-code"
      disabled={disabled}
      slotProps={{ htmlInput: { 'aria-label': 'Cod de autentificare', inputMode: recovery ? 'text' : 'numeric', style: { ...monoSx, fontSize: 20, textAlign: 'center' } } }}
      sx={authInputSx}
    />
  )
}

/** Login, pasul 2: codul din aplicație (sau un cod de recuperare). */
function VerifyStep({ challenge, onDone, onRestart }: { challenge: TwoFactorChallenge; onDone: (session: AuthSession) => void; onRestart: () => void }) {
  const [code, setCode] = useState('')
  const [recovery, setRecovery] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !code.trim()) return
    setBusy(true)
    setError(null)
    try {
      onDone(await authService.verifyTwoFactor(challenge.challengeToken, code))
    } catch (cause) {
      setError(getErrorMessage(cause, 'Codul nu este corect.'))
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <AuthFormHeader title="Cod de autentificare" subtitle={recovery ? 'Un cod de recuperare salvat la configurare.' : 'Codul din aplicația de autentificare.'} error={error ?? undefined} />
      <CodeField value={code} onChange={setCode} recovery={recovery} disabled={busy} />
      <Button type="submit" variant="contained" fullWidth loading={busy} disabled={!code.trim()} sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}>
        Verifică
      </Button>
      <Stack direction="row" sx={{ mt: 2, justifyContent: 'space-between' }}>
        <Link component="button" type="button" variant="body2" underline="hover" onClick={() => { setRecovery((value) => !value); setCode('') }} sx={{ fontWeight: 600, color: AUTH_COLORS.primary }}>
          {recovery ? 'Folosește codul din aplicație' : 'Folosește un cod de recuperare'}
        </Link>
        <Link component="button" type="button" variant="body2" underline="hover" onClick={onRestart} sx={{ color: AUTH_COLORS.textMuted }}>
          Înapoi
        </Link>
      </Stack>
    </Box>
  )
}

/** Configurarea obligatorie: codul QR, primul cod, apoi codurile de recuperare. */
function SetupStep({ challenge, onDone, onRestart }: { challenge: TwoFactorChallenge; onDone: (session: AuthSession) => void; onRestart: () => void }) {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ session: AuthSession; codes: string[] } | null>(null)

  useEffect(() => {
    let active = true
    requestSetup(challenge.challengeToken)
      .then((value) => {
        if (active) setSetup(value)
      })
      .catch((cause) => {
        if (active) setError(getErrorMessage(cause, 'Configurarea nu a putut porni.'))
      })
    return () => {
      active = false
    }
  }, [challenge.challengeToken])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || code.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      const result = await authService.confirmTwoFactorSetup(challenge.challengeToken, code)
      setDone({ session: result.session, codes: result.recoveryCodes })
    } catch (cause) {
      setError(getErrorMessage(cause, 'Codul nu este corect.'))
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    const text = done.codes.join('\n')
    return (
      <Box>
        <AuthFormHeader title="Codurile de recuperare" subtitle="Fiecare merge o singură dată, dacă nu ai telefonul. Nu le mai vezi după acest pas." />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.04)', ...monoSx, fontSize: 15 }}>
          {done.codes.map((item) => (
            <Box key={item}>{item}</Box>
          ))}
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button size="small" onClick={() => void navigator.clipboard?.writeText(text)}>
            Copiază
          </Button>
          <Button size="small" href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Coduri de recuperare RIDElance\n\n${text}\n`)}`} download="ridelance-coduri-recuperare.txt">
            Descarcă
          </Button>
        </Stack>
        <Button variant="contained" fullWidth onClick={() => onDone(done.session)} sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}>
          Am salvat codurile
        </Button>
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <AuthFormHeader title="Autentificare în doi pași" subtitle="Scanează codul cu Authy, Google Authenticator sau altă aplicație, apoi scrie codul afișat." error={error ?? undefined} />
      {setup ? (
        <Stack sx={{ alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box component="img" src={setup.qr} alt="Cod QR pentru aplicația de autentificare" sx={{ width: 200, height: 200, borderRadius: 2, bgcolor: '#fff' }} />
          <Typography variant="caption" sx={{ color: AUTH_COLORS.textMuted }}>
            Sau introdu cheia manual:
          </Typography>
          <Typography sx={{ ...monoSx, fontSize: 14, wordBreak: 'break-all', textAlign: 'center' }}>{setup.secret.match(/.{1,4}/g)?.join(' ')}</Typography>
        </Stack>
      ) : (
        !error && <Typography sx={{ color: AUTH_COLORS.textMuted, mb: 2 }}>Se pregătește codul…</Typography>
      )}
      {error && !setup ? (
        <Button variant="outlined" fullWidth onClick={onRestart}>
          Înapoi la autentificare
        </Button>
      ) : (
        <>
          <CodeField value={code} onChange={setCode} recovery={false} disabled={busy || !setup} />
          <Button type="submit" variant="contained" fullWidth loading={busy} disabled={code.length !== 6} sx={{ ...AUTH_DENSITY.metaToCta, ...authPrimaryButtonSx }}>
            Activează
          </Button>
        </>
      )}
      {error && setup && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Verifică ora telefonului dacă un cod corect e refuzat.
        </Alert>
      )}
    </Box>
  )
}

/** Pasul 2FA al echipei: verificare sau, prima dată, configurare. */
export function TwoFactorStep(props: { challenge: TwoFactorChallenge; onDone: (session: AuthSession) => void; onRestart: () => void }) {
  return props.challenge.twoFactor === 'SETUP' ? <SetupStep {...props} /> : <VerifyStep {...props} />
}
