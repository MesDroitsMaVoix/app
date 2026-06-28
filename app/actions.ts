'use server'

// Server Actions: the only bridge between the client store and Supabase.
// Client code (the Zustand store) imports and calls these as async functions.
// The Supabase service-role key never leaves the server, login codes are
// verified here and never sent to the browser, and every data action requires
// a valid session cookie.

import {
  supabaseConfigured, restSelectAll, restUpsert, restDelete, storageUpload, Row,
} from '@/lib/supabaseRest'
import {
  setSession, clearSession, getSessionAccountId, issueBiometricToken, verifyBiometricToken,
} from '@/lib/session'

const TABLES = ['accounts', 'people', 'ateliers', 'groups', 'events', 'reports', 'conversations', 'notifications'] as const
export type TableName = (typeof TABLES)[number]

// The notifications table was added after the initial schema. If a project
// hasn't run that migration yet, treat it as empty instead of failing.
const OPTIONAL_TABLES = new Set<string>(['notifications'])

function assertTable(table: string): asserts table is TableName {
  if (!(TABLES as readonly string[]).includes(table)) {
    throw new Error(`Unknown table: ${table}`)
  }
}

/* ---------- Auth helpers ---------- */

type Account = { id: string; code?: string | null; role?: string; [k: string]: unknown }

/** Strip the secret code before sending an account to the browser; expose only
 * whether a code has been set (for the first-login flow). */
function sanitizeAccount(acc: Account) {
  const { code, ...rest } = acc
  return { ...rest, hasCode: code != null }
}

async function fetchAccounts(): Promise<Account[]> {
  return (await restSelectAll('accounts')).map((r) => r.data as Account)
}

async function requireAuth(): Promise<string> {
  const id = await getSessionAccountId()
  if (!id) throw new Error('Unauthorized')
  return id
}

async function loadAllData(): Promise<Record<TableName, unknown[]>> {
  const entries = await Promise.all(
    TABLES.map(async (t) => {
      try {
        const rows = (await restSelectAll(t)).map((r) => r.data)
        // Never ship login codes to the client.
        if (t === 'accounts') return [t, rows.map((a) => sanitizeAccount(a as Account))] as const
        return [t, rows] as const
      } catch (err) {
        if (OPTIONAL_TABLES.has(t)) {
          console.warn(`[loadData] optional table "${t}" unavailable — run the migration to enable it.`)
          return [t, [] as unknown[]] as const
        }
        throw err
      }
    })
  )
  return Object.fromEntries(entries) as Record<TableName, unknown[]>
}

/* ---------- Bootstrap / auth ---------- */

export type Bootstrap = {
  configured: boolean
  accounts?: ReturnType<typeof sanitizeAccount>[]
  session?: ReturnType<typeof sanitizeAccount> | null
  data?: Record<TableName, unknown[]> | null
}

/** First call on load: tells the client whether Supabase is configured, the
 * list of accounts for the login picker (no codes), the current session (if the
 * cookie is valid) and, when logged in, all the data. */
// Default content for a brand-new (empty) database, so a fresh deploy has an
// admin + a worker account to start from. Runs server-side, only when empty.
const SEED_ACCOUNTS: Row[] = [
  { id: 'acc-admin', data: { id: 'acc-admin', name: 'Administrateur', initials: 'AD', role: 'admin', code: '2580', personId: 'p7' } },
  { id: 'acc-travailleur', data: { id: 'acc-travailleur', name: 'Travailleur', initials: 'TR', role: 'travailleur', code: '1234', personId: 'p1' } },
]
const SEED_PEOPLE: Row[] = [
  { id: 'p1', data: { id: 'p1', name: 'Travailleur', initials: 'TR', atelier: 'Non précisé', kind: 'travailleur' } },
  { id: 'p7', data: { id: 'p7', name: 'Administrateur', initials: 'AD', atelier: 'Direction', kind: 'admin' } },
]
const SEED_GROUPS: Row[] = [
  { id: 'g-cvs', data: { id: 'g-cvs', name: 'Conseil de la Vie Sociale (CVS)', memberIds: [], atelierIds: [], cvs: true, delegateIds: [], suppleantIds: [] } },
]

async function seedIfEmpty(): Promise<void> {
  if ((await fetchAccounts()).length > 0) return
  await restUpsert('accounts', SEED_ACCOUNTS)
  await restUpsert('people', SEED_PEOPLE)
  await restUpsert('groups', SEED_GROUPS)
}

export async function bootstrap(): Promise<Bootstrap> {
  if (!supabaseConfigured()) return { configured: false }
  await seedIfEmpty()
  const accountsRaw = await fetchAccounts()
  const accounts = accountsRaw.map(sanitizeAccount)
  const accountId = await getSessionAccountId()
  if (!accountId) return { configured: true, accounts, session: null, data: null }
  const sessionAcc = accountsRaw.find((a) => a.id === accountId)
  if (!sessionAcc) { await clearSession(); return { configured: true, accounts, session: null, data: null } }
  return { configured: true, accounts, session: sanitizeAccount(sessionAcc), data: await loadAllData() }
}

export type SignInResult =
  | { ok: true; account: ReturnType<typeof sanitizeAccount>; data: Record<TableName, unknown[]> }
  | { ok: false; error: 'bad-code' | 'bad-token' | 'no-account' | 'not-configured' }

/** Verify a 4-digit code server-side and open a session. Handles first login
 * (an account with no code yet adopts the code entered). */
export async function signIn(accountId: string, code: string): Promise<SignInResult> {
  if (!supabaseConfigured()) return { ok: false, error: 'not-configured' }
  const accountsRaw = await fetchAccounts()
  const acc = accountsRaw.find((a) => a.id === accountId)
  if (!acc) return { ok: false, error: 'no-account' }
  if (acc.code == null) {
    await restUpsert('accounts', [{ id: accountId, data: { ...acc, code } }])
  } else if (acc.code !== code) {
    return { ok: false, error: 'bad-code' }
  }
  await setSession(accountId)
  return { ok: true, account: sanitizeAccount(acc), data: await loadAllData() }
}

export async function signOut(): Promise<void> {
  await clearSession()
}

/* ---------- Biometric unlock (Option A: device-local convenience) ---------- */

/** Issue a biometric token for the currently logged-in account. Called when the
 * user enables Face ID / fingerprint unlock on a device — it must already hold a
 * valid session (i.e. they just signed in with their code). The returned token is
 * stored on the device, behind its biometric gate, and never leaves it. */
export async function enableBiometric(): Promise<{ ok: boolean; token?: string }> {
  if (!supabaseConfigured()) return { ok: false }
  const accountId = await requireAuth()
  return { ok: true, token: issueBiometricToken(accountId) }
}

/** Open a session from a biometric token. The device has already verified the
 * user's biometric locally before calling this; here we only check the token is
 * authentic and still maps to an existing account. */
export async function signInWithBiometric(accountId: string, token: string): Promise<SignInResult> {
  if (!supabaseConfigured()) return { ok: false, error: 'not-configured' }
  const authorised = verifyBiometricToken(token)
  if (!authorised || authorised !== accountId) return { ok: false, error: 'bad-token' }
  const acc = (await fetchAccounts()).find((a) => a.id === accountId)
  if (!acc) return { ok: false, error: 'no-account' }
  await setSession(accountId)
  return { ok: true, account: sanitizeAccount(acc), data: await loadAllData() }
}

/** Re-fetch all data (used by the polling refresh). Requires a session. */
export async function loadData(): Promise<Record<TableName, unknown[]>> {
  if (!supabaseConfigured()) throw new Error('not-configured')
  await requireAuth()
  return loadAllData()
}

/* ---------- Persistence (all require a session) ---------- */

export async function persistUpsert(table: string, rows: Row[]): Promise<void> {
  if (!supabaseConfigured()) return
  await requireAuth()
  assertTable(table)
  let toWrite = rows
  if (table === 'accounts') {
    // The client never holds codes; preserve the existing code when it upserts
    // an account that doesn't carry one.
    const existing = await fetchAccounts()
    const codeById = new Map(existing.map((a) => [a.id, a.code]))
    toWrite = rows.map((r) => {
      const data = r.data as Account
      if (data && data.code === undefined && codeById.has(r.id)) {
        return { id: r.id, data: { ...data, code: codeById.get(r.id) } }
      }
      return r
    })
  }
  await restUpsert(table, toWrite)
}

export async function persistDelete(table: string, ids: string[]): Promise<void> {
  if (!supabaseConfigured()) return
  await requireAuth()
  assertTable(table)
  await restDelete(table, ids)
}

export type UploadedAttachment = { name: string; type: string; url: string }

export async function uploadAttachment(formData: FormData): Promise<UploadedAttachment | null> {
  if (!supabaseConfigured()) return null
  await requireAuth()
  const file = formData.get('file')
  if (!(file instanceof File)) return null
  const dot = file.name.lastIndexOf('.')
  const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const url = await storageUpload(path, await file.arrayBuffer(), file.type || 'application/octet-stream')
  return { name: file.name, type: file.type, url }
}
