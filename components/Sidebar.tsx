'use client'

import { useAppStore, PageId } from '@/store/useAppStore'

const NAV_ITEMS: { id: PageId; icon: string; label: string }[] = [
  { id: 'droits',       icon: 'ti-book-2',         label: 'Mes droits' },
  { id: 'agenda',       icon: 'ti-calendar-event',  label: 'Agenda' },
  { id: 'messagerie',   icon: 'ti-message-2',       label: 'Messagerie' },
  { id: 'organisation', icon: 'ti-sitemap',          label: 'Organisation' },
]

export default function Sidebar() {
  const { activePage, sidebarExpanded, role, setPage, toggleSidebar } = useAppStore()

  const name      = role === 'travailleur' ? 'Jean D.' : 'Sophie V.'
  const initials  = role === 'travailleur' ? 'JD' : 'SV'
  const roleLabel = role === 'travailleur' ? 'Travailleur' : 'Accompagnateur'

  const W = sidebarExpanded ? 240 : 88

  return (
    <nav style={{
      width: W,
      minWidth: W,
      background: '#0F6E56',
      display: 'flex',
      flexDirection: 'column',
      alignItems: sidebarExpanded ? 'flex-start' : 'center',
      padding: sidebarExpanded ? '20px 14px' : '20px 10px',
      gap: '4px',
      flexShrink: 0,
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* Logo */}
      <button
        onClick={toggleSidebar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '12px',
          cursor: 'pointer',
          width: '100%',
          justifyContent: sidebarExpanded ? 'flex-start' : 'center',
          background: 'transparent',
          border: 'none',
        }}
      >
        <div style={{
          width: '46px', height: '46px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="ti ti-shield-check" style={{ fontSize: '24px', color: '#fff' }} />
        </div>
        {sidebarExpanded && (
          <span style={{
            color: '#fff', fontWeight: 600, fontSize: '14px',
            lineHeight: 1.3, textAlign: 'left', whiteSpace: 'nowrap',
          }}>
            Mes Droits<br />Ma Voix
          </span>
        )}
      </button>

      {/* Section label */}
      {sidebarExpanded && (
        <div style={{
          fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
          padding: '0 10px 6px', width: '100%',
        }}>
          Menu principal
        </div>
      )}

      {/* Nav items */}
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => setPage(item.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: sidebarExpanded ? '12px' : '0',
            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            width: '100%',
            padding: '13px 10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: 'background 0.15s',
            background: activePage === item.id ? 'rgba(255,255,255,0.18)' : 'transparent',
            color: activePage === item.id ? '#fff' : 'rgba(255,255,255,0.7)',
          }}
          onMouseEnter={(e) => {
            if (activePage !== item.id)
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            if (activePage !== item.id)
              (e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <i className={`ti ${item.icon}`} style={{ fontSize: '26px', flexShrink: 0 }} />
          {sidebarExpanded && <span>{item.label}</span>}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Role badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        borderRadius: '10px',
        width: '100%',
        background: 'rgba(255,255,255,0.1)',
        justifyContent: sidebarExpanded ? 'flex-start' : 'center',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '38px', height: '38px',
          borderRadius: '50%',
          background: '#9FE1CB',
          color: '#0F6E56',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 600,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        {sidebarExpanded && (
          <div>
            <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{roleLabel}</div>
          </div>
        )}
      </div>
    </nav>
  )
}