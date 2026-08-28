import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded'

import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { userService } from '../../../../services/user.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

/**
 * Confirmarea numărului de telefon, prin cod trimis pe SMS.
 *
 * Numărul se poate schimba de aici: cel care confirmă un număr nou îl vrea pe acela. Schimbarea
 * anulează pe server confirmarea veche — o bifă rămasă pe un număr care nu mai e al contului ar
 * spune exact pe dos față de ce garantează.
 */

/** Cât ține butonul de retrimitere blocat. Aceeași pauză ca pe server. */
const RESEND_SECONDS = 90

export function PhoneVerificationPanel() {
  const [phone, setPhone] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    userService
      .getProfile()
      .then((profile) => {
        if (cancelled) return
        setPhone(profile.phoneNumber ?? '')
        setVerified(profile.isPhoneVerified)
      })
      .catch(() => {
        // Panoul lipsește dacă profilul nu se încarcă; restul paginii nu are de suferit.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      await userService.sendPhoneCode(phone)
      setCodeSent(true)
      setCooldown(RESEND_SECONDS)
    } catch (cause) {
      setError(getErrorMessage(cause, 'Nu am putut trimite codul. Încearcă din nou.'))
    } finally {
      setSending(false)
    }
  }

  const confirm = async () => {
    setConfirming(true)
    setError(null)
    try {
      await userService.confirmPhone(code)
      setVerified(true)
      setCodeSent(false)
      setCode('')
    } catch (cause) {
      setError(getErrorMessage(cause, 'Codul nu a putut fi verificat.'))
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return null

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <SmartphoneRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Număr de telefon</Typography>
        {verified && (
          <Chip
            size="small"
            icon={<CheckCircleRoundedIcon sx={{ fontSize: 15 }} />}
            label="Confirmat"
            sx={{ height: 22, fontWeight: 800, fontSize: '0.68rem', bgcolor: '#DCFCE7', color: '#166534' }}
          />
        )}
      </Stack>

      <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted, mb: 2 }}>
        {verified
          ? 'Numărul e confirmat. Dacă îl schimbi, îți trimitem un cod nou pe numărul nou.'
          : 'Îți trimitem un cod din șase cifre. Confirmarea arată clienților că numărul de pe anunțuri e real.'}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, maxWidth: 640 }}>
        <TextField
          label="Număr de telefon"
          size="small"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)
            setCodeSent(false)
          }}
          placeholder="07XX XXX XXX"
          sx={dashboardInputSx}
        />
        {codeSent && (
          <TextField
            label="Codul din SMS"
            size="small"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
            sx={dashboardInputSx}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: DASHBOARD_TOKENS.radius.md }}>
          {error}
        </Alert>
      )}
      {codeSent && !error && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: DASHBOARD_TOKENS.radius.md }}>
          Am trimis codul pe {phone}. Ajunge în câteva secunde.
        </Alert>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1.5 }}>
        <Button
          variant={codeSent ? 'outlined' : 'contained'}
          onClick={() => void send()}
          disabled={sending || !phone.trim() || cooldown > 0}
          sx={{
            textTransform: 'none',
            fontWeight: 750,
            borderRadius: DASHBOARD_TOKENS.radius.full,
            px: 3,
            ...(codeSent
              ? { color: DASHBOARD_TOKENS.ink, borderColor: DASHBOARD_TOKENS.border }
              : {
                  bgcolor: DASHBOARD_TOKENS.primary,
                  color: DASHBOARD_TOKENS.ink,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
                }),
          }}
        >
          {sending && <CircularProgress size={18} color="inherit" />}
          {!sending && cooldown > 0 && `Retrimite în ${cooldown}s`}
          {!sending && cooldown === 0 && (codeSent ? 'Retrimite codul' : 'Trimite codul')}
        </Button>

        {codeSent && (
          <Button
            variant="contained"
            onClick={() => void confirm()}
            disabled={confirming || code.trim().length < 6}
            sx={{
              textTransform: 'none',
              fontWeight: 750,
              borderRadius: DASHBOARD_TOKENS.radius.full,
              px: 3,
              bgcolor: DASHBOARD_TOKENS.primary,
              color: DASHBOARD_TOKENS.ink,
              boxShadow: 'none',
              '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
            }}
          >
            {confirming ? <CircularProgress size={18} color="inherit" /> : 'Confirmă numărul'}
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
