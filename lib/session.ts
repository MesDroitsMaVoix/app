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

/* ---------- Biometric unlock token ---------- */
// A device that has enrolled biometric unlock holds an opaque, signed token
// (kept behind the device's Face ID / Touch ID / fingerprint gate). It lets the
// device re-open a session without retyping the 4-digit code. The token is an
// HMAC of the account id, so it can't be forged, and it never contains the code.
// It is convenience-grade: the biometric gate is enforced on the device, not by
// the server. Rotating SESSION_SECRET invalidates every issued token at once.

const BIO_PREFIX = 'bio:'

export function issueBiometricToken(accountId: string): string {
  return `${accountId}.${sign(BIO_PREFIX + accountId)}`
}

/** The account id a biometric token authorises, or null if absent/invalid. */
export function verifyBiometricToken(token: string): string | null {
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const id = token.slice(0, i)
  const sig = token.slice(i + 1)
  const expected = sign(BIO_PREFIX + id)
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  return id
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
