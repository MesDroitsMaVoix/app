import { create } from 'zustand'
import { bootstrap, signIn, signInWithBiometric, signOut, loadData, persistUpsert, persistDelete, notifyPush } from '@/app/actions'

export type Role = 'admin' | 'travailleur'

/** Roles allowed to manage personnel, groups, ateliers and the shared agenda,
 * and to validate comptes rendus. */
export function canManage(role: Role): boolean {
  return role === 'admin'
}
export type PageId =
  | 'accueil'
  | 'droits'
  | 'agenda'
  | 'comptes'
  | 'representants'
  | 'messagerie'
  | 'parametres'

/* ---------- People & groups ---------- */

export type PersonKind = 'admin' | 'travailleur'

export interface Person {
  id: string
  name: string
  initials: string
  atelier: string
  kind: PersonKind
  /** Optional profile photo (public URL or data URL). */
  photoUrl?: string
  /** Optional role/function within the ESAT (e.g. "Cuisinier"). */
  fonction?: string
}

export interface Group {
  id: string
  name: string
  /** Persons added directly to the group. */
  memberIds: string[]
  /** Ateliers included in the group — they expand to their own members. */
  atelierIds: string[]
  /** Marks the special, always-present CVS group (Conseil de la Vie Sociale). */
  cvs?: boolean
  /** CVS délégués — may create CVS pre-meetings and convene the CVS. */
  delegateIds?: string[]
  /** CVS suppléants — same CVS rights as délégués. */
  suppleantIds?: string[]
}

export const CVS_GROUP_ID = 'g-cvs'

function makeCvsGroup(): Group {
  return {
    id: CVS_GROUP_ID,
    name: 'Conseil de la Vie Sociale (CVS)',
    memberIds: [],
    atelierIds: [],
    cvs: true,
    delegateIds: [],
    suppleantIds: [],
  }
}

/** Ensure the special CVS group is always present. */
function withCvsGroup(groups: Group[]): Group[] {
  return groups.some((g) => g.cvs) ? groups : [makeCvsGroup(), ...groups]
}

/** The CVS group, if present. */
export function cvsGroup(groups: Group[]): Group | undefined {
  return groups.find((g) => g.cvs)
}

/** All people taking part in the CVS (délégués + suppléants). */
export function cvsMemberIds(groups: Group[]): string[] {
  const g = cvsGroup(groups)
  if (!g) return []
  return [...new Set([...(g.delegateIds ?? []), ...(g.suppleantIds ?? [])])]
}

/** Is the person a CVS délégué or suppléant? */
export function isCvsDelegate(personId: string, groups: Group[]): boolean {
  const g = cvsGroup(groups)
  if (!g) return false
  return (g.delegateIds ?? []).includes(personId) || (g.suppleantIds ?? []).includes(personId)
}

/* ---------- Ateliers ---------- */

/** A workshop. Its chef and suppléants are travailleurs who may create ateliers
 * and write comptes rendus for this atelier (subject to admin validation). */
export interface Atelier {
  id: string
  name: string
  /** Travailleur designated as chef d'atelier (null = not assigned yet). */
  chefId: string | null
  /** Travailleurs suppléants — same rights as the chef on this atelier. */
  suppleantIds: string[]
  /** Travailleurs belonging to this atelier (audience for its reports). */
  memberIds: string[]
}

/** Ateliers a person leads (as chef or suppléant). */
export function ateliersLedBy(personId: string, ateliers: Atelier[]): Atelier[] {
  return ateliers.filter(
    (a) => a.chefId === personId || a.suppleantIds.includes(personId)
  )
}

/** Is the person a chef or suppléant of at least one atelier? */
export function isWorkshopLead(personId: string, ateliers: Atelier[]): boolean {
  return ateliersLedBy(personId, ateliers).length > 0
}

/* ---------- Agenda ---------- */

export type EventType = 'CVS' | 'Atelier' | 'Institution' | 'Mixte'

export interface AgendaEvent {
  id: string
  date: string // ISO yyyy-mm-dd
  time: string
  title: string
  place: string
  type: EventType
  personIds: string[]
  groupIds: string[]
  /** Person id of the creator (a chef/suppléant for atelier meetings they add). */
  authorId?: string
  /** Atelier this meeting belongs to (set for atelier meetings). */
  atelierId?: string
}

/* The currently signed-in travailleur (for "mon agenda") */
export const CURRENT_USER_ID = 'p1'

/* ---------- Meeting reports (comptes rendus) ---------- */

export interface ReportAction {
  text: string
  done: boolean
}

/** A file attached to a report (PDF, image or Word), stored inline as a data
 * URL since the app has no backend. */
export interface ReportAttachment {
  id: string
  name: string
  /** MIME type, e.g. "application/pdf" or "image/png". */
  type: string
  /** base64 data URL of the file content. */
  dataUrl: string
}

/** A report is 'pending' until an admin validates it. Travailleurs only see
 * validated reports; the author (chef/suppléant) sees their own pending ones. */
export type ReportStatus = 'pending' | 'validated'

export interface Report {
  id: string
  title: string
  date: string
  type: EventType
  summary: string
  decisions: string[]
  actions: ReportAction[]
  /** Who can read this report (empty = no one but managers). */
  personIds: string[]
  groupIds: string[]
  /** When true, every worker can read this report (overrides personIds/groupIds). */
  audienceAll?: boolean
  /** Attached files (PDF, images, Word). */
  attachments: ReportAttachment[]
  /** Validation workflow. */
  status: ReportStatus
  /** Person id of the author (chef/suppléant or admin). */
  authorId?: string
  /** Atelier this report is about (set when written by a chef/suppléant). */
  atelierId?: string
  /** True when written by a CVS délégué/suppléant (compte rendu du CVS). */
  cvs?: boolean
  /** Human label of what the report is about, for non-atelier contexts
   * (e.g. "Conseil de la Vie Sociale (CVS)", "Préréunion CVS"). */
  contextLabel?: string
  /** Epoch ms when the report was written. */
  createdAt?: number
}

/* ---------- Messaging ---------- */

export interface Message {
  id: number
  text: string
  time: string
  sentAt: number // epoch ms, used to allow deletion only within the last hour
  /** Person id of the author (works across users in a shared database). */
  senderId: string
}

/** A message can be deleted only by its author and within this window */
export const DELETE_WINDOW_MS = 60 * 60 * 1000

export interface Conversation {
  id: number
  name: string
  role: string
  initials: string
  messages: Message[]
  /** When set, this is an atelier group conversation (created/synced/removed
   * together with the atelier). */
  atelierId?: string
  /** Members of an atelier conversation (mirrors the atelier's members). */
  memberIds?: string[]
  /** Person ids taking part (both people of a direct conversation). */
  participantIds?: string[]
  /** Per-person epoch ms of the last time they opened this conversation. */
  lastReadBy?: Record<string, number>
}

/** Person ids who take part in a conversation (atelier members or DM pair). */
export function conversationParticipants(c: Conversation): string[] {
  if (c.atelierId) return c.memberIds ?? []
  return c.participantIds ?? []
}

/** Does this conversation hold a message the viewer hasn't seen yet? */
export function isConversationUnread(c: Conversation, viewerId: string): boolean {
  const lastRead = c.lastReadBy?.[viewerId] ?? 0
  return c.messages.some((m) => m.senderId !== viewerId && m.sentAt > lastRead)
}

/* ---------- Notifications ---------- */

/** A real notification generated by an app event (new/validated report, new
 * meeting…). It targets concrete people and tracks who has read it. */
export interface AppNotification {
  id: string
  text: string
  createdAt: number // epoch ms
  /** Person ids who should see this notification. */
  recipientIds: string[]
  /** Person ids who have already read it. */
  readBy: string[]
  /** Person ids who cleared/dismissed it from their box. */
  dismissedBy?: string[]
  /** Page opened when the notification is clicked. */
  page?: PageId
  /** For message notifications: the conversation to open. Also used to coalesce
   * (one notification per conversation, refreshed instead of spamming). */
  convId?: number
}

export interface Account {
  id: string
  name: string
  initials: string
  role: Role
  /** 4-digit access code. Present only in demo mode / on the server; stripped
   * before reaching the browser when Supabase is configured. */
  code?: string | null
  /** Whether a code has been set (sent to the client instead of the code). */
  hasCode?: boolean
  /** Link to the people directory (for agenda / messaging). */
  personId?: string
}

/** Map a personnel "kind" to a login role. */
function kindToRole(kind: PersonKind): Role {
  return kind === 'admin' ? 'admin' : 'travailleur'
}

/** Random 4-digit code, e.g. "0427". */
function generateCode(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

interface AppState {
  role: Role
  activePage: PageId
  notifOpen: boolean

  /** True while the initial load from the database is in progress. */
  loading: boolean
  /** True once data is backed by Supabase (writes are persisted). */
  persist: boolean

  accounts: Account[]
  currentAccountId: string | null

  people: Person[]
  groups: Group[]
  ateliers: Atelier[]
  events: AgendaEvent[]
  reports: Report[]

  conversations: Conversation[]
  activeConversationId: number

  notifications: AppNotification[]

  /** Load data from Supabase (or stay in demo mode if not configured). */
  hydrate: () => Promise<void>
  /** Re-fetch all data from the database (polling refresh). */
  refresh: () => Promise<void>

  /** Verify a code server-side and open a session (configured mode). */
  signInAccount: (accountId: string, code: string) => Promise<{ ok: boolean; error?: string }>
  /** Open a session from a device biometric token (Option A unlock). */
  biometricLogin: (accountId: string, token: string) => Promise<{ ok: boolean; error?: string }>
  login: (accountId: string) => void
  logout: () => void
  changeCode: (accountId: string, code: string) => void
  /** Admin: generate a fresh random 4-digit code for an account; returns it. */
  regenerateCode: (accountId: string) => string
  setPage: (page: PageId) => void
  toggleNotif: () => void
  closeNotif: () => void
  /** Mark every notification addressed to this person as read. */
  markNotificationsRead: (personId: string) => void
  /** Clear (dismiss) all of a person's notifications from their box. */
  clearNotifications: (personId: string) => void

  // personnel management — addPerson also creates a login account and
  // returns its randomly generated first-login code.
  addPerson: (p: Omit<Person, 'id' | 'initials'>) => string
  deletePerson: (id: string) => void
  /** Update profile fields of a person (photo, fonction, name…). */
  updatePerson: (id: string, patch: Partial<Person>) => void

  // group management
  createGroup: (name: string) => void
  deleteGroup: (id: string) => void
  toggleGroupMember: (groupId: string, personId: string) => void
  toggleGroupAtelier: (groupId: string, atelierId: string) => void
  // CVS council membership
  toggleCvsDelegate: (personId: string) => void
  toggleCvsSuppleant: (personId: string) => void

  // atelier management. createAtelier optionally sets a chef (used when a
  // chef d'atelier creates one of their own ateliers).
  createAtelier: (name: string, chefId?: string | null) => void
  deleteAtelier: (id: string) => void
  setAtelierChef: (atelierId: string, chefId: string | null) => void
  toggleAtelierSuppleant: (atelierId: string, personId: string) => void
  toggleAtelierMember: (atelierId: string, personId: string) => void

  // agenda management
  addEvent: (e: Omit<AgendaEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  toggleEventGroup: (eventId: string, groupId: string) => void
  toggleEventPerson: (eventId: string, personId: string) => void

  // report management (comptes rendus)
  addReport: (r: Omit<Report, 'id'>) => void
  updateReport: (id: string, r: Omit<Report, 'id'>) => void
  deleteReport: (id: string) => void
  validateReport: (id: string) => void

  // messaging
  setConversation: (id: number) => void
  sendMessage: (text: string, senderId: string) => void
  deleteMessage: (conversationId: number, messageId: number) => void
  /** Delete a whole conversation (direct chats only; atelier group chats are
   * removed together with their atelier). */
  deleteConversation: (conversationId: number) => void
  startConversation: (person: { id: string; name: string; initials: string; role: string }, viewerId: string) => void
  /** Mark a conversation as read for a person (clears its unread state). */
  markConversationRead: (conversationId: number, personId: string) => void
}

// Données de départ minimales : un compte administrateur et un compte
// travailleur. L'administrateur crée ensuite les vraies personnes, ateliers,
// groupes, réunions et comptes-rendus depuis l'application.
const PEOPLE: Person[] = [
  { id: 'p1', name: 'Travailleur',    initials: 'TR', atelier: 'Non précisé', kind: 'travailleur' },
  { id: 'p7', name: 'Administrateur', initials: 'AD', atelier: 'Direction',   kind: 'admin' },
]

const ATELIERS: Atelier[] = []

const GROUPS: Group[] = [makeCvsGroup()]

const EVENTS: AgendaEvent[] = []

const REPORTS: Report[] = []

const INITIAL_CONVERSATIONS: Conversation[] = []

/** Globally-unique id (works across users/sessions, unlike a counter). */
function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}-${rand}`
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Comptes de connexion de départ : un administrateur et un travailleur.
 * Les codes peuvent être changés dans les paramètres. */
const ACCOUNTS: Account[] = [
  { id: 'acc-admin',       name: 'Administrateur', initials: 'AD', role: 'admin',       code: '2580', personId: 'p7' },
  { id: 'acc-travailleur', name: 'Travailleur',    initials: 'TR', role: 'travailleur', code: '1234', personId: 'p1' },
]

/** Collections that are mirrored to the database, by store key = table name. */
const SYNC_TABLES = ['accounts', 'people', 'ateliers', 'groups', 'events', 'reports', 'conversations', 'notifications'] as const

/** Apply a freshly-loaded set of collections from the database to the store. */
function applyData(set: (partial: Partial<AppState>) => void, d: Record<string, unknown[]>) {
  set({
    people: d.people as Person[],
    ateliers: d.ateliers as Atelier[],
    groups: withCvsGroup(d.groups as Group[]),
    events: d.events as AgendaEvent[],
    reports: d.reports as Report[],
    conversations: d.conversations as Conversation[],
    notifications: (d.notifications ?? []) as AppNotification[],
    loading: false,
  })
}

/** Apply a successful sign-in (code or biometric): load the data, set the
 * current account and start mirroring changes to the database. */
function applySignedIn(
  set: (partial: Partial<AppState>) => void,
  account: { id: string; role?: unknown },
  data: Record<string, unknown[]>
) {
  applyData(set, data)
  set({
    accounts: data.accounts as Account[],
    currentAccountId: account.id,
    role: (account.role as Role) ?? 'travailleur',
    activePage: 'accueil',
    persist: true,
  })
  startSync()
}

/** True while applying server data, so the sync subscription doesn't echo it
 * straight back to the database. */
let applyingRemote = false

/** Keep an atelier's group conversation aligned with the atelier (name + members). */
function syncAtelierConv(conversations: Conversation[], atelier: Atelier): Conversation[] {
  return conversations.map((c) =>
    c.atelierId === atelier.id ? { ...c, name: atelier.name, memberIds: [...atelier.memberIds] } : c
  )
}

/** Resolve an audience (people + groups, expanding groups' ateliers, or everyone)
 * into a concrete list of person ids. */
function expandAudience(
  scope: { personIds: string[]; groupIds: string[]; audienceAll?: boolean },
  people: Person[],
  groups: Group[],
  ateliers: Atelier[]
): string[] {
  if (scope.audienceAll) return people.map((p) => p.id)
  const ids = new Set(scope.personIds)
  scope.groupIds.forEach((gid) => {
    const g = groups.find((x) => x.id === gid)
    if (g) groupPersonIds(g, ateliers).forEach((id) => ids.add(id))
  })
  return [...ids]
}

function makeNotification(text: string, recipientIds: string[], page?: PageId): AppNotification {
  return { id: newId('n'), text, createdAt: Date.now(), recipientIds, readBy: [], page }
}

/** Fire a mobile push to recipients, mirroring an in-app notification. Only in
 * configured (persist) mode; fully fire-and-forget so it never blocks the UI or
 * throws. The server no-ops if VAPID keys aren't set. */
function firePush(
  persist: boolean,
  recipientIds: string[],
  payload: { title: string; body: string; page?: PageId; convId?: number; tag?: string },
) {
  if (!persist || recipientIds.length === 0) return
  void notifyPush(recipientIds, payload).catch(() => {})
}

export const useAppStore = create<AppState>((set, get) => ({
  role: 'travailleur',
  activePage: 'accueil',
  notifOpen: false,

  loading: true,
  persist: false,

  accounts: ACCOUNTS,
  currentAccountId: null,

  people: PEOPLE,
  groups: GROUPS,
  ateliers: ATELIERS,
  events: EVENTS,
  reports: REPORTS,

  conversations: INITIAL_CONVERSATIONS,
  activeConversationId: 0,

  notifications: [],

  hydrate: async () => {
    try {
      const res = await bootstrap()
      if (!res.configured) {
        // Supabase not set up → stay in in-memory demo mode (seed accounts).
        set({ loading: false })
        return
      }
      if (res.session && res.data) {
        // Valid session cookie → restore the logged-in user and their data.
        applyData(set, res.data)
        set({
          accounts: (res.accounts ?? []) as Account[],
          currentAccountId: res.session.id,
          role: (res.session.role as Role) ?? 'travailleur',
          activePage: 'accueil',
          persist: true,
          loading: false,
        })
        startSync()
      } else {
        // Configured but not logged in → just the account picker.
        set({ accounts: (res.accounts ?? []) as Account[], persist: true, loading: false })
      }
    } catch (err) {
      console.error('[store] hydrate failed, falling back to demo mode:', err)
      set({ loading: false })
    }
  },

  refresh: async () => {
    const s = get()
    if (!s.persist || !s.currentAccountId) return
    try {
      const d = await loadData()
      applyingRemote = true
      applyData(set, d)
      set({ accounts: d.accounts as Account[] })
      applyingRemote = false
    } catch (err) {
      applyingRemote = false
      console.error('[store] refresh failed:', err)
    }
  },

  signInAccount: async (accountId, code) => {
    const res = await signIn(accountId, code)
    if (!res.ok) return { ok: false, error: res.error }
    applySignedIn(set, res.account, res.data)
    return { ok: true }
  },

  biometricLogin: async (accountId, token) => {
    const res = await signInWithBiometric(accountId, token)
    if (!res.ok) return { ok: false, error: res.error }
    applySignedIn(set, res.account, res.data)
    return { ok: true }
  },

  login: (accountId) =>
    set((s) => {
      const acc = s.accounts.find((a) => a.id === accountId)
      if (!acc) return {}
      return { currentAccountId: acc.id, role: acc.role, activePage: 'accueil' }
    }),

  logout: () => {
    if (get().persist) void signOut().catch(() => {})
    set({ currentAccountId: null, activePage: 'accueil' })
  },

  changeCode: (accountId, code) =>
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, code } : a)),
    })),

  regenerateCode: (accountId) => {
    const code = generateCode()
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, code } : a)),
    }))
    return code
  },

  setPage: (page) => set({ activePage: page, notifOpen: false }),

  toggleNotif: () => set((s) => ({ notifOpen: !s.notifOpen })),

  closeNotif: () => set({ notifOpen: false }),

  markNotificationsRead: (personId) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.recipientIds.includes(personId) && !n.readBy.includes(personId)
          ? { ...n, readBy: [...n.readBy, personId] }
          : n
      ),
    })),

  clearNotifications: (personId) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.recipientIds.includes(personId) && !(n.dismissedBy ?? []).includes(personId)
          ? { ...n, dismissedBy: [...(n.dismissedBy ?? []), personId], readBy: n.readBy.includes(personId) ? n.readBy : [...n.readBy, personId] }
          : n
      ),
    })),

  addPerson: (p) => {
    const id = newId('p')
    const initials = makeInitials(p.name)
    const code = generateCode()
    set((s) => ({
      people: [...s.people, { ...p, id, initials }],
      accounts: [
        ...s.accounts,
        { id: `acc-${id}`, name: p.name, initials, role: kindToRole(p.kind), code, personId: id },
      ],
    }))
    return code
  },

  deletePerson: (id) =>
    set((s) => {
      const ateliers = s.ateliers.map((a) => ({
        ...a,
        chefId: a.chefId === id ? null : a.chefId,
        suppleantIds: a.suppleantIds.filter((p) => p !== id),
        memberIds: a.memberIds.filter((m) => m !== id),
      }))
      // Reflect the removal in every atelier conversation as well.
      let conversations = s.conversations
      for (const a of ateliers) conversations = syncAtelierConv(conversations, a)
      return {
        people: s.people.filter((p) => p.id !== id),
        accounts: s.accounts.filter((a) => a.personId !== id),
        // Remove the person from every group — including the CVS council, where
        // they may be listed as délégué or suppléant. Missing these left an
        // orphan id referencing a deleted person in the database.
        groups: s.groups.map((g) => ({
          ...g,
          memberIds: g.memberIds.filter((m) => m !== id),
          delegateIds: (g.delegateIds ?? []).filter((d) => d !== id),
          suppleantIds: (g.suppleantIds ?? []).filter((sp) => sp !== id),
        })),
        ateliers,
        events: s.events.map((e) => ({ ...e, personIds: e.personIds.filter((p) => p !== id) })),
        conversations,
      }
    }),

  updatePerson: (id, patch) =>
    set((s) => ({
      people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  createGroup: (name) =>
    set((s) => ({
      groups: [...s.groups, { id: newId('g'), name, memberIds: [], atelierIds: [] }],
    })),

  deleteGroup: (id) =>
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== id),
      events: s.events.map((e) => ({ ...e, groupIds: e.groupIds.filter((gid) => gid !== id) })),
    })),

  toggleGroupMember: (groupId, personId) =>
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              memberIds: g.memberIds.includes(personId)
                ? g.memberIds.filter((m) => m !== personId)
                : [...g.memberIds, personId],
            }
          : g
      ),
    })),

  toggleGroupAtelier: (groupId, atelierId) =>
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              atelierIds: g.atelierIds.includes(atelierId)
                ? g.atelierIds.filter((a) => a !== atelierId)
                : [...g.atelierIds, atelierId],
            }
          : g
      ),
    })),

  toggleCvsDelegate: (personId) =>
    set((s) => ({
      groups: s.groups.map((g) => {
        if (!g.cvs) return g
        const delegates = g.delegateIds ?? []
        return {
          ...g,
          delegateIds: delegates.includes(personId)
            ? delegates.filter((x) => x !== personId)
            : [...delegates, personId],
          // a person can't be délégué and suppléant at the same time
          suppleantIds: (g.suppleantIds ?? []).filter((x) => x !== personId),
        }
      }),
    })),

  toggleCvsSuppleant: (personId) =>
    set((s) => ({
      groups: s.groups.map((g) => {
        if (!g.cvs) return g
        const supp = g.suppleantIds ?? []
        return {
          ...g,
          suppleantIds: supp.includes(personId)
            ? supp.filter((x) => x !== personId)
            : [...supp, personId],
          delegateIds: (g.delegateIds ?? []).filter((x) => x !== personId),
        }
      }),
    })),

  createAtelier: (name, chefId = null) =>
    set((s) => {
      const atelierId = newId('a')
      const memberIds = chefId ? [chefId] : []
      // Creating an atelier also opens its group conversation in the messaging.
      const conversation: Conversation = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        role: "Atelier",
        initials: makeInitials(name),
        messages: [],
        atelierId,
        memberIds,
      }
      return {
        ateliers: [...s.ateliers, { id: atelierId, name, chefId, suppleantIds: [], memberIds }],
        conversations: [...s.conversations, conversation],
      }
    }),

  deleteAtelier: (id) =>
    set((s) => ({
      ateliers: s.ateliers.filter((a) => a.id !== id),
      groups: s.groups.map((g) => ({ ...g, atelierIds: g.atelierIds.filter((a) => a !== id) })),
      reports: s.reports.map((r) => (r.atelierId === id ? { ...r, atelierId: undefined } : r)),
      // Deleting an atelier deletes its conversation too.
      conversations: s.conversations.filter((c) => c.atelierId !== id),
    })),

  setAtelierChef: (atelierId, chefId) =>
    set((s) => {
      const ateliers = s.ateliers.map((a) =>
        a.id === atelierId
          ? {
              ...a,
              chefId,
              // a chef can't also be their own suppléant; ensure they're a member
              suppleantIds: a.suppleantIds.filter((p) => p !== chefId),
              memberIds: chefId && !a.memberIds.includes(chefId) ? [...a.memberIds, chefId] : a.memberIds,
            }
          : a
      )
      const atelier = ateliers.find((a) => a.id === atelierId)
      return { ateliers, conversations: atelier ? syncAtelierConv(s.conversations, atelier) : s.conversations }
    }),

  toggleAtelierSuppleant: (atelierId, personId) =>
    set((s) => {
      const ateliers = s.ateliers.map((a) =>
        a.id === atelierId
          ? {
              ...a,
              suppleantIds: a.suppleantIds.includes(personId)
                ? a.suppleantIds.filter((p) => p !== personId)
                : [...a.suppleantIds, personId],
              // a suppléant is implicitly a member of the atelier
              memberIds:
                !a.suppleantIds.includes(personId) && !a.memberIds.includes(personId)
                  ? [...a.memberIds, personId]
                  : a.memberIds,
            }
          : a
      )
      const atelier = ateliers.find((a) => a.id === atelierId)
      return { ateliers, conversations: atelier ? syncAtelierConv(s.conversations, atelier) : s.conversations }
    }),

  toggleAtelierMember: (atelierId, personId) =>
    set((s) => {
      const ateliers = s.ateliers.map((a) =>
        a.id === atelierId
          ? {
              ...a,
              memberIds: a.memberIds.includes(personId)
                ? a.memberIds.filter((m) => m !== personId)
                : [...a.memberIds, personId],
            }
          : a
      )
      const atelier = ateliers.find((a) => a.id === atelierId)
      return { ateliers, conversations: atelier ? syncAtelierConv(s.conversations, atelier) : s.conversations }
    }),

  addEvent: (e) =>
    set((s) => {
      const event = { ...e, id: newId('e') }
      const recipients = expandAudience(event, s.people, s.groups, s.ateliers)
      const notif = makeNotification(`Nouvelle réunion : ${event.title}`, recipients, 'agenda')
      firePush(s.persist, recipients, { title: 'Nouvelle réunion', body: event.title, page: 'agenda' })
      return { events: [...s.events, event], notifications: [notif, ...s.notifications] }
    }),

  deleteEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  toggleEventGroup: (eventId, groupId) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              groupIds: e.groupIds.includes(groupId)
                ? e.groupIds.filter((g) => g !== groupId)
                : [...e.groupIds, groupId],
            }
          : e
      ),
    })),

  toggleEventPerson: (eventId, personId) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              personIds: e.personIds.includes(personId)
                ? e.personIds.filter((p) => p !== personId)
                : [...e.personIds, personId],
            }
          : e
      ),
    })),

  addReport: (r) =>
    set((s) => {
      const report = { ...r, id: newId('r') }
      let notif: AppNotification
      if (report.status === 'pending') {
        // Pending report → notify the admins who must validate it.
        const admins = s.people.filter((p) => p.kind === 'admin').map((p) => p.id)
        notif = makeNotification(`Compte rendu à valider : ${report.title}`, admins, 'comptes')
        firePush(s.persist, admins, { title: 'Compte rendu à valider', body: report.title, page: 'comptes' })
      } else {
        // Published directly → notify its audience.
        const recipients = expandAudience(report, s.people, s.groups, s.ateliers)
        notif = makeNotification(`Nouveau compte rendu : ${report.title}`, recipients, 'comptes')
        firePush(s.persist, recipients, { title: 'Nouveau compte rendu', body: report.title, page: 'comptes' })
      }
      return { reports: [report, ...s.reports], notifications: [notif, ...s.notifications] }
    }),

  updateReport: (id, r) =>
    set((s) => ({ reports: s.reports.map((x) => (x.id === id ? { ...r, id } : x)) })),

  deleteReport: (id) =>
    set((s) => ({ reports: s.reports.filter((x) => x.id !== id) })),

  validateReport: (id) =>
    set((s) => {
      const report = s.reports.find((x) => x.id === id)
      const reports = s.reports.map((x) => (x.id === id ? { ...x, status: 'validated' as const } : x))
      if (!report) return { reports }
      // Validation makes the report visible → notify its audience.
      const recipients = expandAudience(report, s.people, s.groups, s.ateliers)
      const notif = makeNotification(`Nouveau compte rendu : ${report.title}`, recipients, 'comptes')
      firePush(s.persist, recipients, { title: 'Nouveau compte rendu', body: report.title, page: 'comptes' })
      return { reports, notifications: [notif, ...s.notifications] }
    }),

  setConversation: (id) => set({ activeConversationId: id }),

  sendMessage: (text, senderId) =>
    set((s) => {
      const conv = s.conversations.find((c) => c.id === s.activeConversationId)
      if (!conv) return {}
      const now = Date.now()
      const message: Message = {
        id: now,
        text,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        sentAt: now,
        senderId,
      }
      const conversations = s.conversations.map((c) =>
        c.id === conv.id
          ? { ...c, messages: [...c.messages, message], lastReadBy: { ...(c.lastReadBy ?? {}), [senderId]: now } }
          : c
      )

      // Notify the other participants — coalesced: at most one notification per
      // conversation, refreshed on each new message rather than spamming.
      const recipients = conversationParticipants(conv).filter((id) => id !== senderId)
      let notifications = s.notifications
      if (recipients.length > 0) {
        const senderName = s.people.find((p) => p.id === senderId)?.name ?? 'Quelqu’un'
        const notifText = conv.atelierId
          ? `Nouveau message de ${senderName} · ${conv.name}`
          : `Nouveau message de ${senderName}`
        const existing = notifications.find((n) => n.convId === conv.id)
        if (existing) {
          notifications = notifications.map((n) =>
            n.id === existing.id ? { ...n, text: notifText, createdAt: now, recipientIds: recipients, readBy: [], dismissedBy: [] } : n
          )
        } else {
          notifications = [
            { id: newId('n'), text: notifText, createdAt: now, recipientIds: recipients, readBy: [], page: 'messagerie', convId: conv.id },
            ...notifications,
          ]
        }
        firePush(s.persist, recipients, {
          title: conv.atelierId ? conv.name : senderName,
          body: conv.atelierId ? `${senderName} : ${text}` : text,
          page: 'messagerie',
          convId: conv.id,
          tag: `conv-${conv.id}`,
        })
      }
      return { conversations, notifications }
    }),

  deleteMessage: (conversationId, messageId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      ),
    })),

  deleteConversation: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== conversationId),
      // Drop the selection if it was the deleted one, and clear its notifications.
      activeConversationId: s.activeConversationId === conversationId ? 0 : s.activeConversationId,
      notifications: s.notifications.filter((n) => n.convId !== conversationId),
    })),

  markConversationRead: (conversationId, personId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastReadBy: { ...(c.lastReadBy ?? {}), [personId]: Date.now() } }
          : c
      ),
      // Clear the message notification for this conversation for this person.
      notifications: s.notifications.map((n) =>
        n.convId === conversationId && n.recipientIds.includes(personId) && !n.readBy.includes(personId)
          ? { ...n, readBy: [...n.readBy, personId] }
          : n
      ),
    })),

  startConversation: (person, viewerId) =>
    set((s) => {
      // Reuse an existing direct conversation between the same two people.
      const existing = s.conversations.find(
        (c) => !c.atelierId && (c.participantIds ?? []).includes(person.id) && (c.participantIds ?? []).includes(viewerId)
      )
      if (existing) return { activeConversationId: existing.id, activePage: 'messagerie' }
      const id = Date.now()
      return {
        conversations: [
          ...s.conversations,
          { id, name: person.name, role: person.role, initials: person.initials, messages: [], participantIds: [viewerId, person.id] },
        ],
        activeConversationId: id,
        activePage: 'messagerie',
      }
    }),
}))

/* ---------- Database sync ---------- */
// Once hydrate() confirms Supabase is configured, we subscribe to the store and
// mirror every change to the database. Because all store actions create new
// object references for changed rows (immutable updates), we can diff cheaply by
// reference: changed/added rows are upserted, removed ids are deleted. This means
// the 20 actions above don't need any persistence code of their own.

let syncStarted = false

type Snap = Record<string, Map<string, { id: string | number }>>

function snapshot(state: AppState): Snap {
  const snap: Snap = {}
  for (const table of SYNC_TABLES) {
    const map = new Map<string, { id: string | number }>()
    for (const item of state[table] as { id: string | number }[]) map.set(String(item.id), item)
    snap[table] = map
  }
  return snap
}

function startSync() {
  if (syncStarted) return
  syncStarted = true
  let prev = snapshot(useAppStore.getState())
  // If a table's write fails (e.g. its migration hasn't been run), stop trying
  // to persist it so we don't spam errors on every change.
  const disabled = new Set<string>()

  useAppStore.subscribe((state) => {
    if (!state.persist) return
    // Data just loaded from the server — don't echo it back.
    if (applyingRemote) { prev = snapshot(state); return }
    for (const table of SYNC_TABLES) {
      if (disabled.has(table)) continue
      const current = state[table] as { id: string | number }[]
      const prevMap = prev[table]
      const upserts: { id: string; data: unknown }[] = []
      const seen = new Set<string>()
      for (const item of current) {
        const id = String(item.id)
        seen.add(id)
        if (prevMap.get(id) !== item) upserts.push({ id, data: item }) // new or changed
      }
      const deletes: string[] = []
      for (const id of prevMap.keys()) if (!seen.has(id)) deletes.push(id)

      const onErr = (e: unknown) => {
        disabled.add(table)
        console.error(`[sync] persisting "${table}" failed — disabled for this session`, e)
      }
      if (upserts.length) persistUpsert(table, upserts).catch(onErr)
      if (deletes.length) persistDelete(table, deletes).catch(onErr)
    }
    prev = snapshot(state)
  })
}

/* ---------- Selectors / helpers ---------- */

/** Every person belonging to a group: its direct members plus the members of
 * every atelier the group includes. */
export function groupPersonIds(group: Group, ateliers: Atelier[]): string[] {
  const ids = new Set(group.memberIds)
  group.delegateIds?.forEach((id) => ids.add(id))
  group.suppleantIds?.forEach((id) => ids.add(id))
  group.atelierIds.forEach((aid) => {
    ateliers.find((a) => a.id === aid)?.memberIds.forEach((m) => ids.add(m))
  })
  return [...ids]
}

/** Is the person in the given audience (direct id or via a group — counting the
 * members of the group's ateliers)? Works for events and reports. */
export function isPersonInScope(
  scope: { personIds: string[]; groupIds: string[]; audienceAll?: boolean },
  personId: string,
  groups: Group[],
  ateliers: Atelier[]
): boolean {
  if (scope.audienceAll) return true
  if (scope.personIds.includes(personId)) return true
  return scope.groupIds.some((gid) => {
    const g = groups.find((x) => x.id === gid)
    return g ? groupPersonIds(g, ateliers).includes(personId) : false
  })
}

/** Is the given person assigned to the event (directly or via a group)? */
export function isPersonInEvent(
  event: AgendaEvent,
  personId: string,
  groups: Group[],
  ateliers: Atelier[]
): boolean {
  return isPersonInScope(event, personId, groups, ateliers)
}
