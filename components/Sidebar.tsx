'use client'

import { useAppStore, PageId, Role, canManage, conversationParticipants, isConversationUnread } from '@/store/useAppStore'
import { C } from '@/components/ui'

type NavItem = { id: PageId; icon: string; label: string }

function navItems(role: Role): NavItem[] {
  return [
    { id: 'accueil',     icon: 'ti-home',           label: 'Accueil' },
    { id: 'droits',      icon: 'ti-book-2',         label: 'Mes droits' },
    { id: 'agenda',      icon: 'ti-calendar-event', label: 'Agenda' },
    { id: 'comptes',     icon: 'ti-file-text',      label: 'Comptes rendus' },
    canManage(role)
      ? { id: 'representants', icon: 'ti-users-group', label: 'Gestion du personnel' }
      : { id: 'representants', icon: 'ti-users',       label: 'Mes représentants' },
    { id: 'messagerie',  icon: 'ti-message-2',      label: 'Messagerie' },
  ]
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrateur',
  travailleur: 'Travailleur',
}

/** Porte-Voix mark for the dark sidebar (coral body, green waves, white handle). */
function LogoMark() {
  return (
    <svg width="40" height="34" viewBox="-64 -42 130 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M-44,-18 L8,-32 a9,9 0 0 1 11,8 V24 a9,9 0 0 1 -11,8 L-44,18 Z" fill="#FF6B5E" />
      <rect x="-56" y="-18" width="14" height="36" rx="6" fill="#fff" />
      <path d="M-31,21 v14 a10,10 0 0 0 16,0 v-8 Z" fill="#FF6B5E" />
      <g stroke="#16A34A" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M29,-21 q11,4 11,21" />
        <path d="M40,-32 q21,8 21,32" />
      </g>
    </svg>
  )
}

export default function Sidebar() {
  const { activePage, role, accounts, currentAccountId, conversations, setPage } = useAppStore()
  const NAV_ITEMS = navItems(role)

  const me = accounts.find((a) => a.id === currentAccountId)
  const name = me?.name ?? ''
  const initials = me?.initials ?? '?'
  const roleLabel = ROLE_LABEL[role]

  // Unread-messages indicator for the Messagerie tab.
  const viewerId = me?.personId ?? ''
  const hasUnreadMessages = conversations.some(
    (c) => conversationParticipants(c).includes(viewerId) && isConversationUnread(c, viewerId)
  )

  return (
    <nav
      aria-label="Menu principal"
      style={{
        width: 250,
        minWidth: 250,
        background: C.ink,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: 4,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px 20px' }}>
        <LogoMark />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600,
          color: '#fff', lineHeight: 1.1,
        }}>
          Mes Droits,<br />
          <span style={{ color: C.primary }}>Ma Voix</span>
        </span>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const active = activePage === item.id
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', padding: '14px 14px', borderRadius: 12,
              border: 'none', cursor: 'pointer', textAlign: 'left',
              fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
              background: active ? C.primary : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.72)',
              boxShadow: active ? '0 4px 12px rgba(255,107,94,0.35)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 25, flexShrink: 0 }} />
            <span>{item.label}</span>
            {item.id === 'messagerie' && hasUnreadMessages && (
              <span style={{
                marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%',
                background: active ? '#fff' : C.primary, flexShrink: 0,
              }} />
            )}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* Profile badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 12,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: C.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{roleLabel}</div>
        </div>
      </div>
    </nav>
  )
}
