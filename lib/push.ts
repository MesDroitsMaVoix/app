// Client-side Web Push helpers. Turns the browser's PushManager subscription
// on/off and mirrors it to the server (which stores it and sends the pushes).
//
// iOS note: Web Push only works when the PWA is installed to the home screen
// (iOS 16.4+). In a regular Safari tab, `pushSupported()` is false there.

import { subscribeToPush, unsubscribeFromPush } from '@/app/actions'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

/** Can this browser register for push, and is a public key configured? */
export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  )
}

/** Current OS-level permission for notifications ('default' | 'granted' | 'denied'). */
export function pushPermission(): NotificationPermission {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied'
}

/** Is this device already subscribed? */
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false
  const reg = await navigator.serviceWorker.ready
  return (await reg.pushManager.getSubscription()) != null
}

/** VAPID public keys are base64url; PushManager wants a Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/** Ask for permission, subscribe this device and register it on the server.
 * Returns true when notifications are now enabled. */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string) as BufferSource,
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await subscribeToPush(sub.toJSON() as any)
  return res.ok
}

/** Unsubscribe this device and remove it from the server. */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await unsubscribeFromPush(sub.endpoint)
  await sub.unsubscribe().catch(() => {})
}
