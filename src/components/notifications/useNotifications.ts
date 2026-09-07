import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationService, type Notification } from '../../services/notification.service'
import { useAppSelector } from '../../store/hooks'

export const NOTIFICATIONS_CHANGED = 'ridelance:notifications-changed'

export function useNotifications() {
  const userId = useAppSelector((s) => s.auth.userId)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const revision = useRef(0)
  const mutation = useRef(false)
  const reload = useCallback(() => {
    const request = ++revision.current
    return notificationService.getAll().then((items) => {
      if (request === revision.current) { setNotifications(items); setError('') }
    }).catch(() => {
      if (request === revision.current) setError('Nu am putut încărca notificările. Reîncearcă.')
    }).finally(() => {
      if (request === revision.current) setLoading(false)
    })
  }, [])

  useEffect(() => {
    const requests = revision
    void reload()
    const refresh = () => { void reload() }
    const onPush = (event: MessageEvent) => { if (event.data?.type === 'notifications-changed') refresh() }
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh)
    window.addEventListener('focus', refresh)
    navigator.serviceWorker?.addEventListener('message', onPush)
    return () => {
      ++requests.current
      window.clearInterval(timer)
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh)
      window.removeEventListener('focus', refresh)
      navigator.serviceWorker?.removeEventListener('message', onPush)
    }
  }, [reload, userId])

  const change = async (action: () => Promise<void>, update: (items: Notification[]) => Notification[]) => {
    if (mutation.current) return false
    mutation.current = true
    setBusy(true)
    ++revision.current
    try {
      await action()
      ++revision.current
      setNotifications(update)
      setError('')
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
      return true
    } catch {
      setError('Modificarea nu a fost salvată. Reîncearcă.')
      return false
    } finally {
      mutation.current = false
      setBusy(false)
    }
  }
  return {
    notifications, loading, error, busy, reload,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    read: (id: string) => change(() => notificationService.markAsRead(id), (items) => items.map((n) => n.id === id ? { ...n, isRead: true } : n)),
    readAll: () => change(() => notificationService.markAllAsRead(), (items) => items.map((n) => ({ ...n, isRead: true }))),
    dismiss: (id: string) => change(() => notificationService.dismiss(id), (items) => items.filter((n) => n.id !== id)),
  }
}
