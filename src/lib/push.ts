import { api } from './axios';

/**
 * Utility to convert the Base64 VAPID public key into a Uint8Array required by PushManager
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

async function getOrCreatePushSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.error('VITE_VAPID_PUBLIC_KEY is not defined in the environment variables.');
    return null;
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });
}

async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const subscriptionJson = subscription.toJSON();
  await api.post('/users/push/subscribe', {
    endpoint: subscriptionJson.endpoint,
    p256dh: subscriptionJson.keys?.p256dh,
    auth: subscriptionJson.keys?.auth,
  });
}

/**
 * Links this device's push subscription to the currently authenticated user.
 * Does not prompt — only runs when browser permission is already granted.
 * Used when switching accounts on the same device or restoring a session.
 */
export async function syncPushSubscriptionForUser(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const subscription = await getOrCreatePushSubscription();
    if (!subscription) return false;

    await sendSubscriptionToBackend(subscription);
    return true;
  } catch (error) {
    console.error('Failed to sync push subscription:', error);
    return false;
  }
}

/**
 * Prompts the user for notification permission, then subscribes and registers
 * the device with the backend for the current account.
 */
export async function requestPushNotificationPermission(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported by the browser.');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  return syncPushSubscriptionForUser();
}

/** @deprecated Use requestPushNotificationPermission or syncPushSubscriptionForUser */
export async function subscribeToPushNotifications() {
  return requestPushNotificationPermission();
}

const NOTIF_PROMPT_PREFIX = 'ridelance-notif-prompted:';

export function getNotificationPromptSessionKey(userId: string) {
  return `${NOTIF_PROMPT_PREFIX}${userId}`;
}

export function clearNotificationPromptSession(userId?: string) {
  if (userId) {
    sessionStorage.removeItem(getNotificationPromptSessionKey(userId));
    return;
  }
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith(NOTIF_PROMPT_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
}
