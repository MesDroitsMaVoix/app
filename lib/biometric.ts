// Client-side biometric unlock (Option A): use the WebAuthn platform
// authenticator (Face ID / Touch ID / Android fingerprint) as a local gate that
// guards a server-issued token. Enrolling stores { accountId, token, credentialId }
// on the device; unlocking requires a fresh biometric assertion before the token
// is replayed to the server. We deliberately do NOT verify the WebAuthn assertion
// server-side — this is a convenience unlock, not passwordless auth (see the
// `enableBiometric` note in app/actions.ts).

import { enableBiometric } from '@/app/actions'

const STORAGE_KEY = 'mdmv_bio'

export type BiometricEntry = {
  accountId: string
  token: string
  /** base64url of the credential rawId, to target this exact passkey on unlock. */
  credentialId: string
}

/* ---------- base64url helpers ---------- */

function toB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const bytes = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/* ---------- capability checks ---------- */

export function biometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials
  )
}

/** True when the device actually has a usable biometric sensor wired to WebAuthn. */
export async function biometricAvailable(): Promise<boolean> {
  if (!biometricSupported()) return false
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/* ---------- enrolled-entry storage ---------- */

export function getBiometricEntry(): BiometricEntry | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BiometricEntry) : null
  } catch {
    return null
  }
}

export function clearBiometric(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/* ---------- enroll / unlock ---------- */

/** Create a platform passkey and pair it with a fresh server token. Requires an
 * active session (the user just signed in with their code). Returns false if the
 * user cancels the biometric prompt or it isn't available. */
export async function enrollBiometric(accountId: string, displayName: string): Promise<boolean> {
  if (!biometricSupported()) return false

  const res = await enableBiometric()
  if (!res.ok || !res.token) return false

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Mes Droits Ma Voix', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(accountId),
          name: displayName,
          displayName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null

    if (!credential) return false

    const entry: BiometricEntry = {
      accountId,
      token: res.token,
      credentialId: toB64url(credential.rawId),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
    return true
  } catch {
    // User cancelled or the authenticator refused.
    return false
  }
}

/** Prompt the device biometric for the enrolled credential. Returns true only on
 * a successful Face ID / Touch ID / fingerprint match. */
export async function verifyBiometric(entry: BiometricEntry): Promise<boolean> {
  if (!biometricSupported()) return false
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [{ type: 'public-key', id: fromB64url(entry.credentialId) }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return !!assertion
  } catch {
    return false
  }
}
