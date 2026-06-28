// Server-only session handling. A signed (HMAC) cookie holds the logged-in
// account id; it can't be forged without the server secret. Codes are verified
// server-side and never sent to the browser.

import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE = 'mdmv_session'
// Reuse the service-role key as HMAC secret so no extra env var is needed.
const SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-only-secret'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function sign(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url')
}

export async function setSession(accountId: string): Promise<void> {
  const token = `${accountId}.${sign(accountId)}`
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/** The authenticated account id from the cookie, or null if absent/invalid. */
export async function getSessionAccountId(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const id = token.slice(0, i)
  const sig = token.slice(i + 1)
  // constant-time compare
  const expected = sign(id)
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  return id
}
