import { useState } from 'react'
import { Badge, IconButton, Popover } from '@mui/material'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import { DASHBOARD_TOKENS as T } from '../dashboard/dashboardTheme'
import { useNotifications } from './useNotifications'
import { NotificationsPanel } from './NotificationsPanel'

export function NotificationsBell() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const state = useNotifications()
  return <>
    <IconButton size="small" aria-label="Notificări" aria-expanded={!!anchor} onClick={(event) => { setAnchor(event.currentTarget); void state.reload() }} sx={{ border: '1px solid ' + T.border, bgcolor: T.paper }}>
      <Badge badgeContent={state.unreadCount} color="error" overlap="circular"><NotificationsRoundedIcon fontSize="small" sx={{ color: T.textMuted }} /></Badge>
    </IconButton>
    <Popover open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { bgcolor: T.paper, width: 400, maxWidth: 'calc(100vw - 24px)', mt: 1, borderRadius: T.radius.lg + 'px', border: '1px solid ' + T.border, boxShadow: T.shadow.md } } }}>
      <NotificationsPanel state={state} compact onNavigate={() => setAnchor(null)} />
    </Popover>
  </>
}
