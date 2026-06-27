'use client'

import { useAppStore, PageId } from '@/store/useAppStore'
import { C, Card } from '@/components/ui'

const SHORTCUTS: { id: PageId; icon: string; label: string; desc: string }[] = [
  { id: 'droits',        icon: 'ti-book-2',         label: 'Mes droits',        desc: 'Comprendre mes droits simplement' },
  { id: 'agenda',        icon: 'ti-calendar-event', label: 'Agenda',            desc: 'Voir les prochaines réunions' },
  { id: 'comptes',       icon: 'ti-file-text',      label: 'Comptes rendus',    desc: 'Lire les décisions prises' },
  { id: 'representants', icon: 'ti-users',          label: 'Mes représentants', desc: 'Savoir à qui parler' },
  { id: 'messagerie',    icon: 'ti-message-2',      label: 'Messagerie',        desc: 'Poser une question, proposer une idée' },
]

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Accueil() {
  const { accounts, currentAccountId, events, setPage } = useAppStore()
  const me = accounts.find((a) => a.id === currentAccountId)
  const firstName = me?.name.split(' ')[0] ?? 'Bonjour'

  // Soonest upcoming meeting (today or later), if any.
  const todayIso = new Date().toISOString().slice(0, 10)
  const nextEvent = [...events]
    .filter((e) => e.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0]

  return (
    <div style={{ maxWidth: 1180 }}>
      {/* Greeting banner */}
      <div style={{
        background: C.primary, color: '#fff',
        borderRadius: 20, padding: '28px 30px', marginBottom: 28,
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, margin: '0 0 6px' }}>
          Bonjour {firstName} 👋
        </h2>
        <p style={{ fontSize: 18, margin: 0, color: 'rgba(255,255,255,0.9)' }}>
          Bienvenue sur votre espace. Ici, vous trouvez vos droits, vos réunions et vos représentants.
        </p>
      </div>

      {/* Next event highlight — only when there is an upcoming meeting */}
      {nextEvent && (
        <Card style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 18, borderLeft: `6px solid ${C.primary}` }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: C.light,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-calendar-star" style={{ fontSize: 30, color: C.primary }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>Prochaine réunion</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{nextEvent.title}</div>
            <div style={{ fontSize: 16, color: C.sub, textTransform: 'capitalize' }}>
              {formatDate(nextEvent.date)} · {nextEvent.time} · {nextEvent.place}
            </div>
          </div>
          <button
            onClick={() => setPage('agenda')}
            style={{
              background: C.primary, color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 18px', fontSize: 16, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Voir l&apos;agenda
          </button>
        </Card>
      )}

      {/* Shortcuts */}
      <h3 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: '0 0 14px' }}>Que voulez-vous faire ?</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {SHORTCUTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setPage(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16,
              padding: 18, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.mid }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.line }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 13, background: C.light,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 28, color: C.primary }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{s.label}</div>
              <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
