'use client'

import { useState } from 'react'
import { C, PageIntro, Card, ReadAloud } from '@/components/ui'

interface Droit {
  icon: string
  title: string
  short: string
  details: string[]
}

const DROITS: Droit[] = [
  {
    icon: 'ti-message-circle',
    title: "J'ai le droit de m'exprimer",
    short: 'Je peux donner mon avis et proposer des idées.',
    details: [
      'Je peux parler de ce qui me plaît ou ne me plaît pas au travail.',
      'Je peux proposer des idées pour améliorer la vie dans l\'ESAT.',
      'Mes représentants portent ma voix dans les réunions.',
    ],
  },
  {
    icon: 'ti-users-group',
    title: "J'ai le droit d'être représenté",
    short: 'Des personnes parlent en mon nom dans les instances.',
    details: [
      'Le Conseil de la Vie Sociale (CVS) défend les travailleurs.',
      'Des délégués portent mes questions à la direction.',
      'Je peux les contacter à tout moment dans la messagerie.',
    ],
  },
  {
    icon: 'ti-vote',
    title: "J'ai le droit de voter",
    short: 'Je peux élire mes représentants et participer aux décisions.',
    details: [
      'Je choisis les personnes qui me représentent.',
      'Je participe aux votes qui concernent ma vie au travail.',
      'Chaque voix compte, y compris la mienne.',
    ],
  },
  {
    icon: 'ti-shield-check',
    title: "J'ai le droit d'être respecté",
    short: 'Je suis traité avec dignité et en sécurité.',
    details: [
      'Personne n\'a le droit de me faire du mal ou de me manquer de respect.',
      'Je travaille dans de bonnes conditions et en sécurité.',
      'Je peux signaler une situation qui ne va pas.',
    ],
  },
  {
    icon: 'ti-school',
    title: "J'ai le droit d'apprendre",
    short: 'Je peux me former et développer mes compétences.',
    details: [
      'Je peux suivre des formations pour progresser.',
      'Je peux découvrir de nouveaux métiers et ateliers.',
      'Mon accompagnement est adapté à mes besoins.',
    ],
  },
  {
    icon: 'ti-clock',
    title: "J'ai droit à des congés et du repos",
    short: 'Je peux me reposer et prendre des vacances.',
    details: [
      'J\'ai droit à des jours de congés payés chaque année.',
      'J\'ai des temps de pause pendant la journée.',
      'Mon temps de repos est protégé.',
    ],
  },
]

export default function Droits() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageIntro
          icon="ti-book-2"
          title="Mes droits"
          text="Voici vos droits, expliqués avec des mots simples. Cliquez sur une carte pour en savoir plus."
        />
        <ReadAloud
          label="Lire mes droits"
          getText={() => DROITS.map((d) => `${d.title}. ${d.short} ${d.details.join('. ')}`).join('. ')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: 14, alignItems: 'start' }}>
        {DROITS.map((d, i) => {
          const isOpen = open === i
          return (
            <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                  padding: 20, background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: 14, background: C.light,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className={`ti ${d.icon}`} style={{ fontSize: 30, color: C.primary }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 19, fontWeight: 600, color: C.ink }}>{d.title}</div>
                  <div style={{ fontSize: 16, color: C.sub, lineHeight: 1.4 }}>{d.short}</div>
                </div>
                <i
                  className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`}
                  style={{ fontSize: 26, color: C.sub, flexShrink: 0 }}
                />
              </button>

              {isOpen && (
                <div style={{ padding: '0 20px 20px 90px' }}>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {d.details.map((line, j) => (
                      <li key={j} style={{ display: 'flex', gap: 10, fontSize: 16, color: C.ink, lineHeight: 1.5 }}>
                        <i className="ti ti-circle-check" style={{ fontSize: 22, color: C.green, flexShrink: 0 }} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
