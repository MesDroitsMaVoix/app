import { create } from 'zustand'

export type Role = 'travailleur' | 'representant' | 'accompagnateur'

/** Roles allowed to manage personnel, groups and the shared agenda */
export function canManage(role: Role): boolean {
  return role === 'accompagnateur' || role === 'representant'
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

export type PersonKind = 'travailleur' | 'representant' | 'stagiaire'

export interface Person {
  id: string
  name: string
  initials: string
  atelier: string
  kind: PersonKind
}

export interface Group {
  id: string
  name: string
  memberIds: string[]
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
}

/* The currently signed-in travailleur (for "mon agenda") */
export const CURRENT_USER_ID = 'p1'

/* ---------- Messaging ---------- */

export interface Message {
  id: number
  from: 'moi' | 'representant'
  text: string
  time: string
  sentAt: number // epoch ms, used to allow deletion only within the last hour
}

/** A message can be deleted only by its author and within this window */
export const DELETE_WINDOW_MS = 60 * 60 * 1000

export interface Conversation {
  id: number
  name: string
  role: string
  initials: string
  messages: Message[]
}

export interface Account {
  id: string
  name: string
  initials: string
  role: Role
  /** 4-digit access code. null = not chosen yet (defined on first login). */
  code: string | null
  /** Link to the people directory (for agenda / messaging). */
  personId?: string
}

/** Map a personnel "kind" to a login role. */
function kindToRole(kind: PersonKind): Role {
  return kind === 'representant' ? 'representant' : 'travailleur'
}

/** Random 4-digit code, e.g. "0427". */
function generateCode(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

interface AppState {
  role: Role
  activePage: PageId
  notifOpen: boolean

  accounts: Account[]
  currentAccountId: string | null

  people: Person[]
  groups: Group[]
  events: AgendaEvent[]

  conversations: Conversation[]
  activeConversationId: number

  login: (accountId: string) => void
  logout: () => void
  changeCode: (accountId: string, code: string) => void
  setPage: (page: PageId) => void
  toggleNotif: () => void
  closeNotif: () => void

  // personnel management — addPerson also creates a login account and
  // returns its randomly generated first-login code.
  addPerson: (p: Omit<Person, 'id' | 'initials'>) => string
  deletePerson: (id: string) => void

  // group management
  createGroup: (name: string) => void
  deleteGroup: (id: string) => void
  toggleGroupMember: (groupId: string, personId: string) => void

  // agenda management
  addEvent: (e: Omit<AgendaEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  toggleEventGroup: (eventId: string, groupId: string) => void
  toggleEventPerson: (eventId: string, personId: string) => void

  // messaging
  setConversation: (id: number) => void
  sendMessage: (text: string) => void
  deleteMessage: (conversationId: number, messageId: number) => void
  startConversation: (person: { name: string; initials: string; role: string }) => void
}

const PEOPLE: Person[] = [
  { id: 'p1', name: 'Jean D.',   initials: 'JD', atelier: 'Atelier Conditionnement', kind: 'travailleur' },
  { id: 'p2', name: 'Fatima Z.', initials: 'FZ', atelier: 'Atelier Conditionnement', kind: 'travailleur' },
  { id: 'p3', name: 'Lucas P.',  initials: 'LP', atelier: 'Atelier Espaces verts',   kind: 'travailleur' },
  { id: 'p4', name: 'Nadia B.',  initials: 'NB', atelier: 'Atelier Cuisine',         kind: 'travailleur' },
  { id: 'p5', name: 'Hugo M.',   initials: 'HM', atelier: 'Atelier Espaces verts',   kind: 'travailleur' },
  { id: 'p6', name: 'Emma R.',   initials: 'ER', atelier: 'Atelier Cuisine',         kind: 'stagiaire' },
  { id: 'p7', name: 'Marie L.',  initials: 'ML', atelier: 'Déléguée CVS',            kind: 'representant' },
  { id: 'p8', name: 'Karim B.',  initials: 'KB', atelier: 'Délégué des travailleurs', kind: 'representant' },
]

const GROUPS: Group[] = [
  { id: 'g1', name: 'Tous les travailleurs', memberIds: ['p1', 'p2', 'p3', 'p4', 'p5'] },
  { id: 'g2', name: 'Atelier Conditionnement', memberIds: ['p1', 'p2'] },
  { id: 'g3', name: 'Atelier Espaces verts', memberIds: ['p3', 'p5'] },
  { id: 'g4', name: 'Atelier Cuisine', memberIds: ['p4', 'p6'] },
  { id: 'g5', name: 'Représentants', memberIds: ['p7', 'p8'] },
]

const EVENTS: AgendaEvent[] = [
  { id: 'e1', date: '2026-06-18', time: '11h00', title: "Réunion d'atelier",               place: 'Atelier Conditionnement', type: 'Atelier',     personIds: [], groupIds: ['g2'] },
  { id: 'e2', date: '2026-06-25', time: '14h00', title: 'Conseil de la Vie Sociale (CVS)',  place: 'Salle de réunion',        type: 'CVS',         personIds: [], groupIds: ['g1', 'g5'] },
  { id: 'e3', date: '2026-07-02', time: '10h30', title: 'Réunion de mon atelier',           place: 'Atelier Conditionnement', type: 'Atelier',     personIds: [], groupIds: ['g2'] },
  { id: 'e4', date: '2026-07-09', time: '14h00', title: 'Instance mixte',                   place: 'Grande salle',            type: 'Mixte',       personIds: [], groupIds: ['g1', 'g5'] },
  { id: 'e5', date: '2026-07-16', time: '09h30', title: 'Réunion institutionnelle',         place: 'Réfectoire',              type: 'Institution', personIds: [], groupIds: ['g1'] },
]

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 1, name: 'Marie L.', role: 'Déléguée CVS', initials: 'ML',
    messages: [
      { id: 1, from: 'representant', text: 'Bonjour Jean ! Comment puis-je vous aider ?', time: '09:12', sentAt: 0 },
      { id: 2, from: 'moi', text: 'Bonjour, je voudrais proposer une idée pour la cantine.', time: '09:15', sentAt: 0 },
      { id: 3, from: 'representant', text: 'Très bien, je note votre proposition pour la prochaine réunion.', time: '09:18', sentAt: 0 },
    ],
  },
  {
    id: 2, name: 'Karim B.', role: 'Délégué des travailleurs', initials: 'KB',
    messages: [
      { id: 1, from: 'representant', text: 'Bonjour, la réunion de votre atelier est prévue jeudi.', time: 'Hier', sentAt: 0 },
    ],
  },
  {
    id: 3, name: 'Sophie V.', role: 'Accompagnatrice', initials: 'SV',
    messages: [
      { id: 1, from: 'representant', text: "N'hésitez pas si vous avez une question sur vos droits.", time: 'Lundi', sentAt: 0 },
    ],
  },
]

let groupCounter = GROUPS.length
let eventCounter = EVENTS.length
let personCounter = PEOPLE.length
let conversationCounter = INITIAL_CONVERSATIONS.length

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Login accounts. Codes (4 digits) are defined by each user on first login
 * and stored in localStorage — see components/Login.tsx. */
const ACCOUNTS: Account[] = [
  { id: 'acc-jean',  name: 'Jean D.',  initials: 'JD', role: 'travailleur',  code: null, personId: 'p1' },
  { id: 'acc-marie', name: 'Marie L.', initials: 'ML', role: 'representant', code: null, personId: 'p7' },
]

export const useAppStore = create<AppState>((set) => ({
  role: 'travailleur',
  activePage: 'accueil',
  notifOpen: false,

  accounts: ACCOUNTS,
  currentAccountId: null,

  people: PEOPLE,
  groups: GROUPS,
  events: EVENTS,

  conversations: INITIAL_CONVERSATIONS,
  activeConversationId: 1,

  login: (accountId) =>
    set((s) => {
      const acc = s.accounts.find((a) => a.id === accountId)
      if (!acc) return {}
      return { currentAccountId: acc.id, role: acc.role, activePage: 'accueil' }
    }),

  logout: () => set({ currentAccountId: null }),

  changeCode: (accountId, code) =>
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, code } : a)),
    })),

  setPage: (page) => set({ activePage: page, notifOpen: false }),

  toggleNotif: () => set((s) => ({ notifOpen: !s.notifOpen })),

  closeNotif: () => set({ notifOpen: false }),

  addPerson: (p) => {
    const id = `p${++personCounter}`
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
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      accounts: s.accounts.filter((a) => a.personId !== id),
      groups: s.groups.map((g) => ({ ...g, memberIds: g.memberIds.filter((m) => m !== id) })),
      events: s.events.map((e) => ({ ...e, personIds: e.personIds.filter((p) => p !== id) })),
    })),

  createGroup: (name) =>
    set((s) => ({
      groups: [...s.groups, { id: `g${++groupCounter}`, name, memberIds: [] }],
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

  addEvent: (e) =>
    set((s) => ({ events: [...s.events, { ...e, id: `e${++eventCounter}` }] })),

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

  setConversation: (id) => set({ activeConversationId: id }),

  sendMessage: (text) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === s.activeConversationId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: c.messages.length + 1,
                  from: 'moi',
                  text,
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  sentAt: Date.now(),
                },
              ],
            }
          : c
      ),
    })),

  deleteMessage: (conversationId, messageId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      ),
    })),

  startConversation: (person) =>
    set((s) => {
      const existing = s.conversations.find((c) => c.name === person.name)
      if (existing) return { activeConversationId: existing.id, activePage: 'messagerie' }
      const id = ++conversationCounter
      return {
        conversations: [
          ...s.conversations,
          { id, name: person.name, role: person.role, initials: person.initials, messages: [] },
        ],
        activeConversationId: id,
        activePage: 'messagerie',
      }
    }),
}))

/* ---------- Selectors / helpers ---------- */

/** Is the given person assigned to the event (directly or via a group)? */
export function isPersonInEvent(
  event: AgendaEvent,
  personId: string,
  groups: Group[]
): boolean {
  if (event.personIds.includes(personId)) return true
  return event.groupIds.some((gid) => groups.find((g) => g.id === gid)?.memberIds.includes(personId))
}
