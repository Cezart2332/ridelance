import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import { DASHBOARD_TOKENS } from '../dashboard/dashboardTheme'
import { notificationService, type Notification } from '../../services/notification.service'
import { isRecurringDocumentationNotification } from '../../constants/recurringDocumentationNotification'

function relativeTime(utcString: string): string {
  const diff = Date.now() - new Date(utcString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Acum'
  if (mins < 60) return `Acum ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Acum ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Ieri' : `Acum ${days} zile`
}

type NotificationsBellProps = {
  onOpenRecurringDocumentation?: () => void
}

export function NotificationsBell({ onOpenRecurringDocumentation }: NotificationsBellProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const loadNotifications = useCallback(() => {
    setLoading(true)
    notificationService
      .getAll()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60_000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    loadNotifications()
  }

  const handleClose = () => setAnchorEl(null)

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
        )
      } catch {
        /* ignore */
      }
    }

    if (isRecurringDocumentationNotification(notification)) {
      onOpenRecurringDocumentation?.()
    }

    handleClose()
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="Notificari"
        onClick={handleOpen}
        sx={{
          border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
          backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.92),
          transition: '0.2s',
          '&:hover': {
            backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.1),
            color: DASHBOARD_TOKENS.primaryStrong,
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          overlap="circular"
          invisible={unreadCount === 0}
        >
          <NotificationsRoundedIcon fontSize="small" sx={{ color: DASHBOARD_TOKENS.textMuted }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              boxShadow: DASHBOARD_TOKENS.shadow.md,
              mt: 1,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>Notificări</Typography>
        </Box>
        <Divider />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Box>
        )}

        {!loading && notifications.length === 0 && (
          <Typography sx={{ px: 2, py: 3, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
            Nu ai notificări momentan.
          </Typography>
        )}

        {!loading && notifications.length > 0 && (
          <List dense disablePadding sx={{ maxHeight: 320, overflow: 'auto' }}>
            {notifications.map((n) => (
              <ListItemButton
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                sx={{
                  alignItems: 'flex-start',
                  py: 1.2,
                  bgcolor: n.isRead ? 'transparent' : alpha(DASHBOARD_TOKENS.primary, 0.06),
                  borderLeft: n.isRead
                    ? '3px solid transparent'
                    : `3px solid ${DASHBOARD_TOKENS.primary}`,
                }}
              >
                <ListItemText
                  primary={n.text}
                  secondary={relativeTime(n.createdAtUtc)}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: n.isRead ? 600 : 800,
                        fontSize: '0.85rem',
                        color: DASHBOARD_TOKENS.ink,
                      },
                    },
                    secondary: {
                      sx: {
                        fontSize: '0.75rem',
                        color: DASHBOARD_TOKENS.textSubtle,
                      },
                    },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
    </>
  )
}
