'use client'

import { useAppStore } from '@/store/useAppStore'

const PAGE_TITLES = {
  droits: 'Mes Droits',
  agenda: 'Agenda',
  messagerie: 'Messagerie',
  organisation: 'Organisation',
}

const NOTIFICATIONS = [
  { msg: 'Nouveau compte rendu CVS disponible', time: 'Il y a 1h', read: false },
  { msg: 'Rappel : Réunion institutionnelle dans 7 jours', time: 'Ce matin', read: false },
  { msg: 'Marie L. vous a répondu', time: 'Hier', read: true },
  { msg: "Nouvel événement ajouté à l'agenda : Instance mixte", time: 'Il y a 2 jours', read: true },
]

export default function Topbar() {
  const { activePage, role, notifOpen, toggleRole, toggleNotif } = useAppStore()
  const roleLabel = role === 'travailleur' ? 'Travailleur' : 'Accompagnateur'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 32px',
      borderBottom: '1px solid #e7e5e4',
      background: '#fff',
      flexShrink: 0,
      position: 'relative',
      minHeight: '68px',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        fontWeight: 600,
        color: '#1c1917',
        margin: 0,
      }}>
        {PAGE_TITLES[activePage]}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Notif */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={toggleNotif}
            style={{
              width: '40px', height: '40px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fafaf9', border: '1px solid #e7e5e4',
              color: '#78716c', fontSize: '20px', cursor: 'pointer',
              position: 'relative',
            }}
          >
            <i className="ti ti-bell" />
            <span style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '8px', height: '8px', background: '#ef4444',
              borderRadius: '50%', border: '2px solid #fff',
            }} />
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '48px',
              width: '300px', background: '#fff',
              border: '1px solid #e7e5e4', borderRadius: '12px',
              zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              maxHeight: '380px', overflowY: 'auto',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f4', fontSize: '13px', fontWeight: 600 }}>
                Notifications
              </div>
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f5f5f4',
                  cursor: 'pointer',
                  borderLeft: n.read ? 'none' : '3px solid #1D6A5E',
                }}>
                  <div style={{ fontSize: '13px', color: '#1c1917', lineHeight: 1.4 }}>{n.msg}</div>
                  <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '4px' }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role toggle */}
        <button
          onClick={toggleRole}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '999px',
            border: '1px solid #e7e5e4', background: '#fafaf9',
            fontSize: '13px', fontWeight: 500, color: '#44403c',
            cursor: 'pointer',
          }}
        >
          <i className="ti ti-user-circle" style={{ fontSize: '16px' }} />
          {roleLabel}
        </button>
      </div>
    </div>
  )
}