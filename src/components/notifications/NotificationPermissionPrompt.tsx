import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import { useAppSelector } from '../../store/hooks'
import {
  getNotificationPermission,
  getNotificationPromptSessionKey,
  isPushSupported,
  requestPushNotificationPermission,
  syncPushSubscriptionForUser,
} from '../../lib/push'
import { TOKENS } from '../../constants/tokens'

/**
 * Runs after authentication (login, register, or session restore).
 * - Permission already granted on this device → silently register for the current account.
 * - Permission not yet asked → show a friendly prompt (login / register flow).
 * - Same account on a new device → prompt on that device; backend stores each endpoint.
 * - Different account on the same device → auto-register when permission is already granted.
 */
export function NotificationPermissionPrompt() {
  const { accessToken, userId } = useAppSelector((s) => s.auth)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const syncedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!accessToken || !userId || !isPushSupported()) {
      return
    }

    const permission = getNotificationPermission()
    if (permission === 'unsupported') return

    if (permission === 'granted') {
      setOpen(false)
      if (syncedUserIdRef.current === userId) return

      void syncPushSubscriptionForUser().then((success) => {
        if (success) syncedUserIdRef.current = userId
      })
      return
    }

    if (permission === 'denied') {
      setOpen(false)
      return
    }

    // permission === 'default' — ask once per login session (not on every refresh)
    const promptKey = getNotificationPromptSessionKey(userId)
    if (sessionStorage.getItem(promptKey)) return

    sessionStorage.setItem(promptKey, '1')
    setOpen(true)
  }, [accessToken, userId])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const success = await requestPushNotificationPermission()
      if (success && userId) {
        syncedUserIdRef.current = userId
      }
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const handleDismiss = () => {
    setOpen(false)
  }

  if (!isPushSupported()) return null

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${TOKENS.radius.xl}px`,
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.lg,
        },
      }}
    >
      <DialogContent sx={{ pt: 3, pb: 1, px: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: `${TOKENS.radius.lg}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(TOKENS.primary, 0.12),
            color: TOKENS.primaryStrong,
            mb: 2,
          }}
        >
          <NotificationsActiveRoundedIcon />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: TOKENS.ink, mb: 1 }}>
          Activează notificările
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.65, fontSize: '0.92rem' }}>
          Primești alerte despre documente, plăți și mesaje de la contabil direct pe acest dispozitiv.
          Dacă te autentifici pe alt dispozitiv, poți activa notificările și acolo.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={handleDismiss}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: TOKENS.textMuted,
            borderRadius: `${TOKENS.radius.full}px`,
          }}
        >
          Nu acum
        </Button>
        <Button
          variant="contained"
          onClick={handleEnable}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: `${TOKENS.radius.full}px`,
            bgcolor: TOKENS.primary,
            boxShadow: 'none',
            minWidth: 120,
            '&:hover': { bgcolor: TOKENS.primaryStrong, boxShadow: 'none' },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Activează'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
