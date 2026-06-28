'use client'

import { useRef } from 'react'
import { useAppStore, canManage } from '@/store/useAppStore'
import { C } from '@/components/ui'

const PAGE_TITLES = {
  accueil: 'Accueil',
  droits: 'Mes Droits',
  agenda: 'Agenda',
  comptes: 'Comptes rendus',
  representants: 'Mes représentants',
  messagerie: 'Messagerie',
  parametres: 'Paramètres',
}

/** Short relative time, e.g. "il y a 5 min". */
function timeAgo(ts: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (sec < 60) return "à l'instant"
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return d < 7 ? `il y a ${d} j` : new Date(ts).toLocaleDateString('fr-FR')
}

export default function Topbar() {
  const {
    activePage, role, notifOpen, logout, toggleNotif, setPage,
    notifications, accounts, currentAccountId, markNotificationsRead, clearNotifications, setConversation,
  } = useAppStore()
  const roleLabel = role === 'admin' ? 'Administrateur' : 'Travailleur'
  const title =
    activePage === 'representants' && canManage(role)
      ? 'Gestion du personnel'
      : PAGE_TITLES[activePage]

  // Notifications addressed to the current user, most recent first.
  const viewerId = accounts.find((a) => a.id === currentAccountId)?.personId ?? ''
  const myNotifications = notifications
    .filter((n) => n.recipientIds.includes(viewerId) && !(n.dismissedBy ?? []).includes(viewerId))
    .sort((a, b) => b.createdAt - a.createdAt)
  const unreadCount = myNotifications.filter((n) => !n.readBy.includes(viewerId)).length

  // Remember which were unread at the moment of opening, so the panel can still
  // highlight them even after we mark everything read.
  const unreadAtOpen = useRef<Set<string>>(new Set())
  const openNotif = () => {
    if (!notifOpen) {
      unreadAtOpen.current = new Set(
        myNotifications.filter((n) => !n.readBy.includes(viewerId)).map((n) => n.id)
      )
      if (unreadCount > 0) markNotificationsRead(viewerId)
    }
    toggleNotif()
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 32px',
      borderBottom: `1px solid ${C.line}`,
      background: '#fff',
      flexShrink: 0,
      position: 'relative',
      minHeight: '68px',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        fontWeight: 600,
        color: C.ink,
        margin: 0,
      }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Notif */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={openNotif}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lue(s))` : ''}`}
            style={{
              width: '40px', height: '40px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: C.bg, border: `1px solid ${C.line}`,
              color: C.sub, fontSize: '20px', cursor: 'pointer',
              position: 'relative',
            }}
          >
            <i className="ti ti-bell" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px', minWidth: 18, height: 18,
                padding: '0 4px', boxSizing: 'border-box',
                background: C.primary, color: '#fff', fontSize: 11, fontWeight: 700,
                borderRadius: 999, border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '48px',
              width: '320px', background: '#fff',
              border: `1px solid ${C.line}`, borderRadius: '12px',
              zIndex: 100, boxShadow: '0 8px 28px rgba(30,41,59,0.12)',
              maxHeight: '420px', overflowY: 'auto',
            }}>
              <div style={{ padding: '10px 12px 10px 16px', borderBottom: `1px solid ${C.line}`, fontSize: '13px', fontWeight: 600, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span>Notifications</span>
                {myNotifications.length > 0 && (
                  <button
                    onClick={() => clearNotifications(viewerId)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: C.sub, fontSize: 12, fontWeight: 600, padding: '4px 6px', borderRadius: 8 }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 15 }} /> Tout effacer
                  </button>
                )}
              </div>
              {myNotifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: C.sub, fontSize: 14 }}>
                  Aucune notification.
                </div>
              ) : (
                myNotifications.map((n) => {
                  const wasUnread = unreadAtOpen.current.has(n.id)
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (n.convId != null) setConversation(n.convId)
                        if (n.page) setPage(n.page)
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '12px 16px', border: 'none',
                        borderBottom: `1px solid ${C.line}`,
                        cursor: n.page ? 'pointer' : 'default',
                        background: wasUnread ? C.light : '#fff',
                        borderLeft: wasUnread ? `3px solid ${C.primary}` : '3px solid transparent',
                      }}
                    >
                      <div style={{ fontSize: '13px', color: C.ink, lineHeight: 1.4, fontWeight: wasUnread ? 600 : 400 }}>{n.text}</div>
                      <div style={{ fontSize: '11px', color: C.sub, marginTop: '4px' }}>{timeAgo(n.createdAt)}</div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Current role badge */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '999px',
          border: `1px solid ${C.line}`, background: C.bg,
          fontSize: '13px', fontWeight: 600, color: C.sub,
        }}>
          <i className="ti ti-user-circle" style={{ fontSize: '16px' }} />
          {roleLabel}
        </span>

        {/* Settings */}
        <button
          onClick={() => setPage('parametres')}
          aria-label="Paramètres"
          title="Paramètres"
          style={{
            width: '40px', height: '40px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: activePage === 'parametres' ? C.light : C.bg,
            border: `1px solid ${activePage === 'parametres' ? C.primary : C.line}`,
            color: activePage === 'parametres' ? C.primaryDark : C.sub,
            fontSize: '20px', cursor: 'pointer',
          }}
        >
          <i className="ti ti-settings" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Se déconnecter"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '999px',
            border: `1px solid ${C.line}`, background: C.bg,
            fontSize: '13px', fontWeight: 600, color: C.sub,
            cursor: 'pointer',
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: '16px' }} />
          Déconnexion
        </button>
      </div>
    </div>
  )
}