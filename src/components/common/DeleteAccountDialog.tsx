import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { api } from '../../lib/axios'
import { ROUTES } from '../../constants/routes'
import { IS_NATIVE_APP } from '../../native/platform'
import { authService } from '../../services/auth.service'
import { getErrorMessage } from '../../utils/errorHandler'

/**
 * Ștergerea contului de către client, confirmată cu parola. Pe server e închiderea pe care o face
 * și adminul: accesul se pierde, abonamentul se oprește, iar documentele rămân, cum cere legea.
 *
 * Se deschide din Profil și, în aplicația mobilă, și din ecranul conturilor fără dashboard —
 * magazinele de aplicații cer ca orice cont să se poată șterge din aplicație.
 */
export function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (busy) return
    setPassword('')
    setError(null)
    onClose()
  }

  const deleteAccount = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.post('/users/me/delete', { password })
      await authService.logout()
      navigate(IS_NATIVE_APP ? ROUTES.login : '/', { replace: true })
    } catch (cause) {
      setError(getErrorMessage(cause, 'Contul nu a putut fi șters.'))
      setBusy(false)
    }
  }

  return (
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
  )
}
