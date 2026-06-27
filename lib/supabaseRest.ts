// Server-only helper that talks to Supabase over its REST API (PostgREST) and
// Storage HTTP API, using plain fetch — no SDK required.
//
// Uses the SERVICE ROLE key, which bypasses Row Level Security. This file must
// never be imported from client code: it is only used by app/actions.ts
// ("use server"). The key is read from a non-NEXT_PUBLIC_ env var, so it is
// never shipped to the browser.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export type Row = { id: string; data: unknown }

/** True when both the URL and the service-role key are configured. */
export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY)
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SERVICE_KEY as string,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function ensureOk(res: Response, what: string) {
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Supabase ${what} failed: ${res.status} ${body}`)
  }
}

/** Read every row of a table. Returns the stored documents (the `data` column). */
export async function restSelectAll(table: string): Promise<Row[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,data`, {
    headers: headers(),
    cache: 'no-store',
  })
  await ensureOk(res, `select ${table}`)
  return res.json()
}

/** Insert or update rows (matched on the primary key `id`). */
export async function restUpsert(table: string, rows: Row[]): Promise<void> {
  if (rows.length === 0) return
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(rows),
  })
  await ensureOk(res, `upsert ${table}`)
}

/** Delete rows by id. */
export async function restDelete(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const list = ids.map((id) => `"${encodeURIComponent(id)}"`).join(',')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=in.(${list})`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=minimal' }),
  })
  await ensureOk(res, `delete ${table}`)
}

/** Upload a file to the public "attachments" bucket and return its public URL. */
export async function storageUpload(path: string, body: ArrayBuffer, contentType: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/attachments/${path}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY as string,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body,
  })
  await ensureOk(res, 'storage upload')
  return `${SUPABASE_URL}/storage/v1/object/public/attachments/${path}`
}
