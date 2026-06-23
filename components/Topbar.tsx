'use client'

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

const NOTIFICATIONS = [
  { msg: 'Nouveau compte rendu CVS disponible', time: 'Il y a 1h', read: false },
  { msg: 'Rappel : Réunion institutionnelle dans 7 jours', time: 'Ce matin', read: false },
  { msg: 'Marie L. vous a répondu', time: 'Hier', read: true },
  { msg: "Nouvel événement ajouté à l'agenda : Instance mixte", time: 'Il y a 2 jours', read: true },
]

export default function Topbar() {
  const { activePage, role, notifOpen, logout, toggleNotif, setPage } = useAppStore()
  const roleLabel =
    role === 'travailleur' ? 'Travailleur' : role === 'representant' ? 'Représentant' : 'Accompagnateur'
  const title =
    activePage === 'representants' && canManage(role)
      ? 'Gestion du personnel'
      : PAGE_TITLES[activePage]

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
            onClick={toggleNotif}
            style={{
              width: '40px', height: '40px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: C.bg, border: `1px solid ${C.line}`,
              color: C.sub, fontSize: '20px', cursor: 'pointer',
              position: 'relative',
            }}
          >
            <i className="ti ti-bell" />
            <span style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '8px', height: '8px', background: C.primary,
              borderRadius: '50%', border: '2px solid #fff',
            }} />
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '48px',
              width: '300px', background: '#fff',
              border: `1px solid ${C.line}`, borderRadius: '12px',
              zIndex: 100, boxShadow: '0 8px 28px rgba(30,41,59,0.12)',
              maxHeight: '380px', overflowY: 'auto',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.line}`, fontSize: '13px', fontWeight: 600, color: C.ink }}>
                Notifications
              </div>
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${C.line}`,
                  cursor: 'pointer',
                  borderLeft: n.read ? 'none' : `3px solid ${C.primary}`,
                }}>
                  <div style={{ fontSize: '13px', color: C.ink, lineHeight: 1.4 }}>{n.msg}</div>
                  <div style={{ fontSize: '11px', color: C.sub, marginTop: '4px' }}>{n.time}</div>
                </div>
              ))}
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