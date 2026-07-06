import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'

import { useAppSelector } from '../../store/hooks'
import { authService } from '../../services/auth.service'

/**
 * Floating warning shown while an admin is viewing another user's account.
 * Offers a one-click way back to the admin dashboard.
 */
export function ImpersonationBanner() {
  const impersonation = useAppSelector((s) => s.auth.impersonation)
  const navigate = useNavigate()
  const [returning, setReturning] = useState(false)

  if (!impersonation) return null

  const handleReturn = async () => {
    setReturning(true)
    try {
      await authService.stopImpersonation()
      navigate('/admin', { replace: true })
    } catch {
      // The admin refresh cookie is gone — fall back to a clean login.
      await authService.logout()
      navigate('/auth', { replace: true })
    } finally {
      setReturning(false)
    }
  }

  return (
    <Paper
      elevation={8}
      role="alert"
      sx={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: { xs: 'calc(76px + env(safe-area-inset-bottom))', md: 20 },
        zIndex: 2000,
        px: { xs: 2, sm: 2.5 },
        py: 1.25,
        maxWidth: 'min(640px, calc(100vw - 24px))',
        borderRadius: 999,
        border: `1px solid ${alpha('#b45309', 0.35)}`,
        bgcolor: '#fffbeb',
        boxShadow: '0 12px 32px rgba(120, 53, 15, 0.25)',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: '#b45309',
            bgcolor: alpha('#f59e0b', 0.18),
          }}
        >
          <AdminPanelSettingsRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Typography sx={{ color: '#78350f', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.35, minWidth: 0 }}>
          Ești conectat ca admin și vizualizezi contul „{impersonation.targetName}”.
          Orice modificare se face în numele acestui utilizator.
        </Typography>
        <Button
          onClick={handleReturn}
          disabled={returning}
          variant="contained"
          size="small"
          sx={{
            flexShrink: 0,
            borderRadius: 999,
            px: 2,
            fontWeight: 800,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            bgcolor: '#b45309',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#92400e', boxShadow: 'none' },
          }}
        >
          {returning ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Revino la admin'}
        </Button>
      </Stack>
    </Paper>
  )
}
