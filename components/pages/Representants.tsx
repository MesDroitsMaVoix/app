'use client'

import { useAppStore, cvsGroup } from '@/store/useAppStore'
import { C, PageIntro, Card, Avatar } from '@/components/ui'

type Contact = { personId: string; name: string; initials: string; role: string; helps: string; icon: string; photoUrl?: string; fonction?: string }

const HELP_CVS = "Pour la vie dans l'ESAT : repas, sorties, sécurité et vos idées portées au CVS."
const HELP_ADMIN = "Pour vos questions, vos droits et l'organisation de l'établissement."

export default function Representants() {
  const { people, groups, accounts, currentAccountId, setPage, startConversation } = useAppStore()
  const viewerId = accounts.find((a) => a.id === currentAccountId)?.personId ?? ''

  const personById = (id: string) => people.find((p) => p.id === id)
  const cvs = cvsGroup(groups)

  // Build the contact list: CVS délégués, suppléants, then administrateurs.
  const contacts: Contact[] = []
  const seen = new Set<string>()
  const add = (id: string, role: string, helps: string, icon: string) => {
    const p = personById(id)
    if (!p || seen.has(id)) return
    seen.add(id)
    contacts.push({ personId: id, name: p.name, initials: p.initials, role, helps, icon, photoUrl: p.photoUrl, fonction: p.fonction })
  }
  cvs?.delegateIds?.forEach((id) => add(id, 'Délégué·e CVS', HELP_CVS, 'ti-gavel'))
  cvs?.suppleantIds?.forEach((id) => add(id, 'Suppléant·e CVS', HELP_CVS, 'ti-gavel'))
  people.filter((p) => p.kind === 'admin').forEach((p) => add(p.id, 'Administrateur', HELP_ADMIN, 'ti-user-shield'))

  // Don't list the viewer as their own contact.
  const visible = contacts.filter((c) => c.personId !== viewerId)

  const write = (c: Contact) => {
    startConversation({ id: c.personId, name: c.name, initials: c.initials, role: c.role }, viewerId)
    setPage('messagerie')
  }

  return (
    <div style={{ maxWidth: 1180 }}>
      <PageIntro
        icon="ti-users"
        title="Mes représentants"
        text="Voici les personnes qui vous représentent et qui peuvent vous aider. Vous pouvez leur écrire."
      />

      {visible.length === 0 ? (
        <Card style={{ textAlign: 'center', color: C.sub, padding: 30 }}>
          Aucun représentant désigné pour l&apos;instant.
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 16 }}>
          {visible.map((c) => (
            <Card key={c.personId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar initials={c.initials} size={56} src={c.photoUrl} />
                <div>
                  <div style={{ fontSize: 19, fontWeight: 600, color: C.ink }}>{c.name}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: C.primary }}>
                    <i className={`ti ${c.icon}`} style={{ fontSize: 16 }} />
                    {c.role}
                  </div>
                  {c.fonction && <div style={{ fontSize: 14, color: C.sub }}>{c.fonction}</div>}
                </div>
              </div>

              <p style={{ fontSize: 16, color: C.ink, margin: 0, lineHeight: 1.5 }}>{c.helps}</p>

              <button
                onClick={() => write(c)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: C.primary, color: '#fff', border: 'none', borderRadius: 12,
                  padding: '13px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <i className="ti ti-message-2" style={{ fontSize: 20 }} /> Écrire un message
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
