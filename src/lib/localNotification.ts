/**
 * Shows a system notification via the service worker (when permission is granted).
 * Used as a complement to server-sent web push (e.g. on the 1st of the month).
 */
export async function showLocalPushNotification(
  title: string,
  body: string,
  url: string,
): Promise<void> {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: url,
      tag: 'recurring-documentation',
      renotify: true,
    })
  } catch (error) {
    console.error('Failed to show local notification:', error)
  }
}
