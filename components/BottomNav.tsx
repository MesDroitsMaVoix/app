'use client'

import { useAppStore, conversationParticipants, isConversationUnread } from '@/store/useAppStore'
import { navItems } from '@/components/Sidebar'
import { C } from '@/components/ui'

/** Mobile bottom tab bar — replaces the desktop Sidebar on phone-sized screens.
 * Big, always-visible, thumb-reachable targets for accessibility. */
export default function BottomNav() {
  const { activePage, role, accounts, currentAccountId, people, conversations, setPage } = useAppStore()
  const NAV_ITEMS = navItems(role)

  const me = accounts.find((a) => a.id === currentAccountId)
  const viewerId = me?.personId ?? ''
  const hasUnreadMessages = conversations.some(
    (c) => conversationParticipants(c).includes(viewerId) && isConversationUnread(c, viewerId)
  )

  return (
    <nav
      aria-label="Menu principal"
      style={{
        flexShrink: 0,
        display: 'flex',
        background: C.ink,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxSizing: 'border-box',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = activePage === item.id
        const showDot = item.id === 'messagerie' && hasUnreadMessages
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              padding: '9px 2px', minHeight: 60,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: active ? C.primary : 'rgba(255,255,255,0.7)',
            }}
          >
            <span style={{ position: 'relative', lineHeight: 1 }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 26 }} />
              {showDot && (
                <span style={{
                  position: 'absolute', top: -3, right: -5,
                  width: 9, height: 9, borderRadius: '50%',
                  background: C.primary, border: `2px solid ${C.ink}`,
                }} />
              )}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {item.short}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
