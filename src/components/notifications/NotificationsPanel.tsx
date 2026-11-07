import { useEffect, useState } from 'react'
import { Alert, Box, Button, IconButton, List, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { DASHBOARD_TOKENS } from '../dashboard/dashboardTheme'
import { PANEL_COMPAT_DASHBOARD_TOKENS as T } from '../panel/tokens'
import { NOTIFICATIONS_CHANGED, useNotifications } from './useNotifications'
import { notificationDestination, notificationTitle } from './notificationDestination'
import { notificationService } from '../../services/notification.service'
import { isRecurringDocumentationNotification } from '../../constants/recurringDocumentationNotification'
import { PFA_PATHS } from '../../config/pfaNavigation'

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

  // Închiderea lunii: „Încarcă bonuri” și „Nu am bonuri de încărcat”, cu luna din `sectionKey`.
  const monthlyDocs = (n: { type: string; sectionKey?: string | null }) =>
    role === 'Client' && isRecurringDocumentationNotification(n) && !!n.sectionKey && /^\d{4}-\d{2}$/.test(n.sectionKey)
  const hasMonthlyDocs = notifications.some(monthlyDocs)
  const [confirmedMonths, setConfirmedMonths] = useState<string[]>([])
  const [confirming, setConfirming] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState('')
  useEffect(() => {
    if (!hasMonthlyDocs) return undefined
    let cancelled = false
    notificationService
      .getMonthlyDocumentsConfirmations()
      .then((months) => {
        if (!cancelled) setConfirmedMonths(months)
      })
      .catch(() => {
        // Fără listă, butonul rămâne activ; confirmarea e idempotentă pe server.
      })
    return () => {
      cancelled = true
    }
  }, [hasMonthlyDocs])
  const confirmMonth = async (monthKey: string) => {
    setConfirming(monthKey)
    setConfirmError('')
    try {
      await notificationService.confirmMonthlyDocuments(monthKey)
      setConfirmedMonths((months) => [...months, monthKey])
      await state.reload()
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
    } catch {
      setConfirmError('Nu am putut confirma luna. Încearcă din nou.')
    } finally {
      setConfirming(null)
    }
  }
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
      {confirmError && <Alert severity="error" onClose={() => setConfirmError('')} sx={{ m: 1 }}>{confirmError}</Alert>}
      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void state.reload()}>Reîncearcă</Button>} sx={{ m: 1 }}>{error}</Alert>}
      {loading && <Stack spacing={1} sx={{ p: 2 }}><Skeleton height={48} /><Skeleton height={48} /></Stack>}
      {!loading && !error && !items.length && <Typography sx={{ p: 3, fontSize: '0.85rem', color: T.textMuted }}>{unreadOnly ? 'Toate notificările sunt citite.' : 'Nu ai notificări momentan.'}</Typography>}
      <List disablePadding sx={{ maxHeight: compact ? 'min(420px, 65dvh)' : undefined, overflowY: compact ? 'auto' : undefined }}>
        {items.map((n) => {
          const destination = notificationDestination(n, role)
          return (
            <Box component="li" key={n.id} sx={{ p: 2, borderBottom: `1px solid ${T.border}`, bgcolor: n.isRead ? 'transparent' : `var(--rl-hover, ${alpha(DASHBOARD_TOKENS.primary, 0.045)})` }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                {!n.isRead && <Box aria-label="Necitită" sx={{ width: 6, height: 6, flexShrink: 0, borderRadius: '50%', bgcolor: T.accent }} />}
                <Typography sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{notificationTitle(n)}</Typography>
                {!n.isRead && <Tooltip title="Marchează ca citită"><IconButton size="small" disabled={busy} aria-label="Marchează ca citită" onClick={() => void state.read(n.id)}><DoneRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>}
                <Tooltip title="Șterge notificarea"><IconButton size="small" disabled={busy} aria-label="Șterge notificarea" onClick={() => void state.dismiss(n.id)}><DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              </Stack>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 400, lineHeight: 1.55, overflowWrap: 'anywhere', whiteSpace: 'pre-line', color: T.textMuted }}>{n.text}</Typography>
              {monthlyDocs(n) && (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  <Button size="small" variant="contained" disableElevation disabled={busy} sx={{ textTransform: 'none', fontSize: '0.75rem' }} onClick={async () => {
                    if (!n.isRead && !await state.read(n.id)) return
                    onNavigate?.()
                    navigate(PFA_PATHS.docsRecurring)
                  }}>Încarcă bonuri</Button>
                  {confirmedMonths.includes(n.sectionKey!) ? (
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: T.accent, alignSelf: 'center' }}>Luna e completă</Typography>
                  ) : (
                    <Button size="small" variant="outlined" disabled={busy || confirming === n.sectionKey} sx={{ textTransform: 'none', fontSize: '0.75rem' }} onClick={() => void confirmMonth(n.sectionKey!)}>Nu am bonuri de încărcat</Button>
                  )}
                </Stack>
              )}
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 0.8 }}>
                <Typography component="time" dateTime={n.createdAtUtc} sx={{ fontSize: '0.72rem', color: T.textSubtle }}>{new Date(n.createdAtUtc).toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Typography>
                {destination && !monthlyDocs(n) && <Button size="small" disabled={busy} sx={{ textTransform: 'none', fontSize: '0.75rem', color: T.accent }} onClick={async () => {
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
