import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { notificationService } from '../../services/notification.service'
import { useAppSelector } from '../../store/hooks'
import { notificationDestination } from './notificationDestination'
import { NOTIFICATIONS_CHANGED } from './useNotifications'

export default function NotificationOpenPage() {
  const { id } = useParams()
  const role = useAppSelector((s) => s.auth.role)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    void notificationService.getAll().then(async (items) => {
      const notification = items.find((n) => n.id === id)
      if (!notification) throw new Error('Notificarea nu mai este disponibilă.')
      const path = notificationDestination(notification, role)
      if (!path) throw new Error(notification.text)
      if (!notification.isRead) await notificationService.markAsRead(notification.id)
      if (!cancelled) {
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
        navigate(path, { replace: true })
      }
    }).catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Nu am putut deschide notificarea.')
    })
    return () => { cancelled = true }
  }, [id, role, navigate])
  return <Box sx={{ p: 3 }}>{error ? <Alert severity="info" action={<Button onClick={() => navigate('/app')}>Înapoi</Button>}>{error}</Alert> : <CircularProgress aria-label="Se deschide notificarea" />}</Box>
}
