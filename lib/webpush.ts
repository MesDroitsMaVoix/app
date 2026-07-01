// Server-only Web Push helper. Signs and delivers push messages to the browser
// push services (FCM, Apple, Mozilla…) using VAPID. The private key is read from
// a non-NEXT_PUBLIC_ env var, so it never reaches the browser. Must only be
// imported from server code (app/actions.ts, "use server").

import webpush, { type PushSubscription } from 'web-push'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@example.com'

let configured = false
if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
  configured = true
}

/** True when the VAPID keys are set (push is available). */
export function pushConfigured(): boolean {
  return configured
}

export type PushPayload = {
  title: string
  body: string
  /** In-app page to open when the notification is clicked. */
  page?: string
  /** Conversation to open (messaging notifications). */
  convId?: number
  /** Coalescing tag: a new push with the same tag replaces the previous one. */
  tag?: string
}

/** Delivery outcome for one subscription, so callers can prune dead endpoints. */
export type PushResult = { endpoint: string; ok: boolean; gone: boolean }

/** Send a payload to a single subscription. Never throws — reports the outcome.
 * `gone` is true when the push service says the subscription is expired/invalid
 * (HTTP 404/410), meaning it should be deleted. */
export async function sendPush(sub: PushSubscription, payload: PushPayload): Promise<PushResult> {
  const endpoint = sub.endpoint
  if (!configured) return { endpoint, ok: false, gone: false }
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60 * 24 })
    return { endpoint, ok: true, gone: false }
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode
    return { endpoint, ok: false, gone: status === 404 || status === 410 }
  }
}
