'use server'

// Server Actions: the only bridge between the client store and Supabase.
// Client code (the Zustand store) imports and calls these as async functions.
// The Supabase service-role key never leaves the server.

import {
  supabaseConfigured, restSelectAll, restUpsert, restDelete, storageUpload, Row,
} from '@/lib/supabaseRest'

const TABLES = ['accounts', 'people', 'ateliers', 'groups', 'events', 'reports', 'conversations', 'notifications'] as const
export type TableName = (typeof TABLES)[number]

// The notifications table was added after the initial schema. If a project
// hasn't run that migration yet, treat it as empty instead of failing the
// whole load.
const OPTIONAL_TABLES = new Set<string>(['notifications'])

function assertTable(table: string): asserts table is TableName {
  if (!(TABLES as readonly string[]).includes(table)) {
    throw new Error(`Unknown table: ${table}`)
  }
}

export type LoadResult = {
  configured: boolean
  data: Record<TableName, unknown[]> | null
}

/** Load every collection from the database. When Supabase isn't configured,
 * returns { configured: false } so the app stays in in-memory demo mode. */
export async function loadAll(): Promise<LoadResult> {
  if (!supabaseConfigured()) return { configured: false, data: null }
  const entries = await Promise.all(
    TABLES.map(async (t) => {
      try {
        return [t, (await restSelectAll(t)).map((r) => r.data)] as const
      } catch (err) {
        if (OPTIONAL_TABLES.has(t)) {
          console.warn(`[loadAll] optional table "${t}" unavailable — run the migration to enable it.`)
          return [t, [] as unknown[]] as const
        }
        throw err
      }
    })
  )
  return { configured: true, data: Object.fromEntries(entries) as Record<TableName, unknown[]> }
}

/** Insert/update document rows in a collection. */
export async function persistUpsert(table: string, rows: Row[]): Promise<void> {
  if (!supabaseConfigured()) return
  assertTable(table)
  await restUpsert(table, rows)
}

/** Delete document rows from a collection. */
export async function persistDelete(table: string, ids: string[]): Promise<void> {
  if (!supabaseConfigured()) return
  assertTable(table)
  await restDelete(table, ids)
}

export type UploadedAttachment = { name: string; type: string; url: string }

/** Upload one file to Supabase Storage; returns its public URL (or null when
 * Supabase isn't configured, so the caller can fall back to inline base64). */
export async function uploadAttachment(formData: FormData): Promise<UploadedAttachment | null> {
  if (!supabaseConfigured()) return null
  const file = formData.get('file')
  if (!(file instanceof File)) return null
  const dot = file.name.lastIndexOf('.')
  const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const url = await storageUpload(path, await file.arrayBuffer(), file.type || 'application/octet-stream')
  return { name: file.name, type: file.type, url }
}
