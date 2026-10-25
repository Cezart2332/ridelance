import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import GavelRoundedIcon from '@mui/icons-material/GavelRounded'

import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { api } from '../../../../lib/axios'
import { authService } from '../../../../services/auth.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

const LINKS = [
  { label: 'Termeni și condiții', to: '/termeni-si-conditii' },
  { label: 'Politica de confidențialitate', to: '/privacy-policy' },
  { label: 'Politica de cookies', to: '/politica-cookies' },
  { label: 'Politica de plăți și abonamente', to: '/politica-plati-abonamente' },
]

/**
 * Confidențialitate și cont, în subsolul Profilului.
 *
 * Ștergerea contului se face de aici, confirmată cu parola. Pe server e închiderea pe care o face
 * și adminul: accesul se pierde, abonamentul se oprește, iar documentele rămân, cum cere legea.
 * Exportul datelor se cere în continuare prin Suport.
 */
export function PrivacyPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (busy) return
    setOpen(false)
    setPassword('')
    setError(null)
  }

  const deleteAccount = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.post('/users/me/delete', { password })
      await authService.logout()
      navigate('/', { replace: true })
    } catch (cause) {
      setError(getErrorMessage(cause, 'Contul nu a putut fi șters.'))
      setBusy(false)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <GavelRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
          Confidențialitate și cont
        </Typography>
      </Stack>

      <Stack spacing={1.2}>
        {LINKS.map((link) => (
          <Typography
            key={link.to}
            component={RouterLink}
            to={link.to}
            target="_blank"
            sx={{
              color: DASHBOARD_TOKENS.primaryStrong,
              fontWeight: 650,
              fontSize: '0.88rem',
              textDecoration: 'none',
              width: 'fit-content',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {link.label}
          </Typography>
        ))}
      </Stack>

      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.84rem', mt: 2.5, lineHeight: 1.6 }}>
        Pentru exportul datelor tale, scrie-ne în{' '}
        <Typography
          component={RouterLink}
          to="/app/dashboard/suport"
          sx={{ color: DASHBOARD_TOKENS.primaryStrong, fontWeight: 650, textDecoration: 'none', fontSize: 'inherit' }}
        >
          Suport
        </Typography>
        .
      </Typography>

      <Button
        variant="outlined"
        color="error"
        onClick={() => setOpen(true)}
        sx={{ mt: 2.5, textTransform: 'none', fontWeight: 750, borderRadius: `${DASHBOARD_TOKENS.radius.full}px`, px: 3 }}
      >
        Șterge contul
      </Button>

      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 750 }}>Ștergi contul?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Pierzi accesul, iar abonamentul se oprește. Documentele contabile rămân păstrate cât cere legea.
            </Typography>
            <TextField
              type="password"
              label="Parola"
              size="small"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password && !busy) void deleteAccount()
              }}
              autoFocus
              fullWidth
              sx={dashboardInputSx}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={close} disabled={busy} sx={{ textTransform: 'none' }}>
            Anulează
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            onClick={() => void deleteAccount()}
            disabled={busy || !password}
            sx={{ textTransform: 'none', fontWeight: 750 }}
          >
            {busy ? <CircularProgress size={18} color="inherit" /> : 'Șterge contul'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
