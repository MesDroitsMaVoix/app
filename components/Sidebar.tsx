'use client'

import { useAppStore, PageId, Role, canManage } from '@/store/useAppStore'
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
  travailleur: 'Travailleur',
  representant: 'Représentant',
  accompagnateur: 'Accompagnateur',
}

export default function Sidebar() {
  const { activePage, role, accounts, currentAccountId, setPage } = useAppStore()
  const NAV_ITEMS = navItems(role)

  const me = accounts.find((a) => a.id === currentAccountId)
  const name = me?.name ?? ''
  const initials = me?.initials ?? '?'
  const roleLabel = ROLE_LABEL[role]

  return (
    <nav
      aria-label="Menu principal"
      style={{
        width: 250,
        minWidth: 250,
        background: '#fff',
        borderRight: `1px solid ${C.line}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: 4,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '6px 10px 18px' }}>
        <Image
          src="/logo_portevoix_vertical.svg"
          alt="Mes Droits, Ma Voix"
          width={150}
          height={125}
          priority
          style={{ width: 150, height: 'auto' }}
        />
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
              background: active ? C.light : 'transparent',
              color: active ? C.primaryDark : C.sub,
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = C.bg
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 25, flexShrink: 0 }} />
            <span>{item.label}</span>
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* Profile badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 12,
        background: C.bg, border: `1px solid ${C.line}`, boxSizing: 'border-box',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: C.mid, color: C.primaryDark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: C.sub }}>{roleLabel}</div>
        </div>
      </div>
    </nav>
  )
}
