'use client'

import { useAppStore } from '@/store/useAppStore'
import { C, PageIntro, Card, Avatar } from '@/components/ui'

interface Rep {
  convId: number | null
  initials: string
  name: string
  role: string
  instance: string
  helps: string
}

const REPS: Rep[] = [
  {
    convId: 1, initials: 'ML', name: 'Marie L.', role: 'Déléguée CVS',
    instance: 'Conseil de la Vie Sociale',
    helps: 'Pour parler de la vie dans l\'ESAT : repas, sorties, sécurité, idées.',
  },
  {
    convId: 2, initials: 'KB', name: 'Karim B.', role: 'Délégué des travailleurs',
    instance: 'Délégués auprès de la direction',
    helps: 'Pour porter vos questions et vos demandes à la direction.',
  },
  {
    convId: 3, initials: 'SV', name: 'Sophie V.', role: 'Accompagnatrice',
    instance: 'Équipe d\'accompagnement',
    helps: 'Pour être aidé au quotidien et comprendre vos droits.',
  },
  {
    convId: null, initials: 'TD', name: 'Thomas D.', role: 'Chef d\'atelier',
    instance: 'Atelier Conditionnement',
    helps: 'Pour les questions sur votre travail et votre atelier.',
  },
]

export default function Representants() {
  const { setPage, setConversation } = useAppStore()

  const contact = (convId: number) => {
    setConversation(convId)
    setPage('messagerie')
  }

  return (
    <div style={{ maxWidth: 1180 }}>
      <PageIntro
        icon="ti-users"
        title="Mes représentants"
        text="Voici les personnes qui vous représentent et qui peuvent vous aider. Vous pouvez leur écrire."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {REPS.map((r, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar initials={r.initials} size={56} />
              <div>
                <div style={{ fontSize: 19, fontWeight: 600, color: C.ink }}>{r.name}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.primary }}>{r.role}</div>
                <div style={{ fontSize: 14, color: C.sub }}>{r.instance}</div>
              </div>
            </div>

            <p style={{ fontSize: 16, color: C.ink, margin: 0, lineHeight: 1.5 }}>{r.helps}</p>

            {r.convId !== null && (
              <button
                onClick={() => contact(r.convId!)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: C.primary, color: '#fff', border: 'none', borderRadius: 12,
                  padding: '13px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <i className="ti ti-message-2" style={{ fontSize: 20 }} /> Écrire un message
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
