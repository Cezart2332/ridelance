import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import LockRoundedIcon from '@mui/icons-material/LockRounded'

import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { api } from '../../../../lib/axios'
import { getErrorMessage } from '../../../../utils/errorHandler'

const MIN_LENGTH = 8

/**
 * Securitatea contului. Schimbarea parolei cere parola curentă chiar dacă ești autentificat —
 * o sesiune lăsată deschisă pe un dispozitiv străin nu trebuie să fie de ajuns ca să preiei contul.
 */
export function SecurityPanel() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setError(null)
    setDone(false)

    if (next.length < MIN_LENGTH) {
      setError(`Parola nouă trebuie să aibă cel puțin ${MIN_LENGTH} caractere.`)
      return
    }
    if (next !== confirm) {
      setError('Confirmarea nu coincide cu parola nouă.')
      return
    }

    setSaving(true)
    try {
      await api.post('/users/change-password', { currentPassword: current, newPassword: next })
      setCurrent('')
      setNext('')
      setConfirm('')
      setDone(true)
    } catch (cause) {
      setError(getErrorMessage(cause, 'Parola nu a putut fi schimbată.'))
    } finally {
      setSaving(false)
    }
  }

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
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <LockRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Securitate</Typography>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, maxWidth: 640 }}>
        <TextField
          type="password"
          label="Parola curentă"
          size="small"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          sx={{ ...dashboardInputSx, gridColumn: { md: 'span 2' } }}
        />
        <TextField
          type="password"
          label="Parola nouă"
          size="small"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          sx={dashboardInputSx}
        />
        <TextField
          type="password"
          label="Confirmă parola nouă"
          size="small"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          sx={dashboardInputSx}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: DASHBOARD_TOKENS.radius.md }}>
          {error}
        </Alert>
      )}
      {done && (
        <Alert severity="success" sx={{ mt: 2, borderRadius: DASHBOARD_TOKENS.radius.md }}>
          Parola a fost schimbată.
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={() => void submit()}
        disabled={saving || !current || !next || !confirm}
        sx={{
          mt: 2,
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
        {saving ? <CircularProgress size={20} color="inherit" /> : 'Schimbă parola'}
      </Button>
    </Paper>
  )
}
