import { useState } from 'react'
import { Alert, Box, Button, IconButton, List, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { DASHBOARD_TOKENS as T } from '../dashboard/dashboardTheme'
import { useNotifications } from './useNotifications'
import { notificationDestination, notificationTitle } from './notificationDestination'

type State = ReturnType<typeof useNotifications>

export function NotificationsInbox() {
  const state = useNotifications()
  return <NotificationsPanel state={state} />
}

export function NotificationsPanel({ state, compact = false, onNavigate }: { state: State; compact?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const role = useAppSelector((s) => s.auth.role)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { notifications, loading, error, busy, unreadCount } = state
  const items = unreadOnly ? notifications.filter((n) => !n.isRead) : notifications
  return (
    <Box sx={{ color: T.ink }}>
      <Stack spacing={1} sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${T.border}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Notificări</Typography>
        <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          <Button size="small" onClick={() => setUnreadOnly(false)} aria-pressed={!unreadOnly} sx={{ textTransform: 'none', color: T.ink, bgcolor: !unreadOnly ? T.accentWash : undefined }}>Toate</Button>
          <Button size="small" onClick={() => setUnreadOnly(true)} aria-pressed={unreadOnly} sx={{ textTransform: 'none', color: T.ink, bgcolor: unreadOnly ? T.accentWash : undefined }}>Necitite ({unreadCount})</Button>
          <Button size="small" disabled={busy || !unreadCount} onClick={() => void state.readAll()} sx={{ textTransform: 'none', ml: 'auto', fontSize: '0.75rem', color: T.accent }}>Marchează toate ca citite</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void state.reload()}>Reîncearcă</Button>} sx={{ m: 1 }}>{error}</Alert>}
      {loading && <Stack spacing={1} sx={{ p: 2 }}><Skeleton height={48} /><Skeleton height={48} /></Stack>}
      {!loading && !error && !items.length && <Typography sx={{ p: 3, fontSize: '0.85rem', color: T.textMuted }}>{unreadOnly ? 'Toate notificările sunt citite.' : 'Nu ai notificări momentan.'}</Typography>}
      <List disablePadding sx={{ maxHeight: compact ? 'min(420px, 65dvh)' : undefined, overflowY: compact ? 'auto' : undefined }}>
        {items.map((n) => {
          const destination = notificationDestination(n, role)
          return (
            <Box component="li" key={n.id} sx={{ p: 2, borderBottom: `1px solid ${T.border}`, bgcolor: n.isRead ? 'transparent' : alpha(T.primary, 0.045) }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                {!n.isRead && <Box aria-label="Necitită" sx={{ width: 6, height: 6, flexShrink: 0, borderRadius: '50%', bgcolor: T.accent }} />}
                <Typography sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{notificationTitle(n)}</Typography>
                {!n.isRead && <Tooltip title="Marchează ca citită"><IconButton size="small" disabled={busy} aria-label="Marchează ca citită" onClick={() => void state.read(n.id)}><DoneRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>}
                <Tooltip title="Șterge notificarea"><IconButton size="small" disabled={busy} aria-label="Șterge notificarea" onClick={() => void state.dismiss(n.id)}><DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              </Stack>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 400, lineHeight: 1.55, overflowWrap: 'anywhere', color: T.textMuted }}>{n.text}</Typography>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 0.8 }}>
                <Typography component="time" dateTime={n.createdAtUtc} sx={{ fontSize: '0.72rem', color: T.textSubtle }}>{new Date(n.createdAtUtc).toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Typography>
                {destination && <Button size="small" disabled={busy} sx={{ textTransform: 'none', fontSize: '0.75rem', color: T.accent }} onClick={async () => {
                  if (!n.isRead && !await state.read(n.id)) return
                  onNavigate?.()
                  navigate(destination)
                }}>Deschide</Button>}
              </Stack>
            </Box>
          )
        })}
      </List>
    </Box>
  )
}
