'use client'

import { useState } from 'react'
import { C, PageIntro, Card } from '@/components/ui'

interface Report {
  title: string
  date: string
  type: string
  summary: string
  decisions: string[]
  actions: { text: string; done: boolean }[]
}

const REPORTS: Report[] = [
  {
    title: 'Conseil de la Vie Sociale (CVS)',
    date: '28 mai 2026',
    type: 'CVS',
    summary: 'Nous avons parlé des repas, des sorties et de la sécurité dans les ateliers.',
    decisions: [
      'Un nouveau menu sera proposé à la cantine.',
      'Une sortie au parc est organisée en juillet.',
      'Des panneaux plus clairs seront installés dans les couloirs.',
    ],
    actions: [
      { text: 'Choisir le nouveau menu avec le cuisinier', done: true },
      { text: 'Réserver le bus pour la sortie', done: false },
      { text: 'Commander les panneaux', done: false },
    ],
  },
  {
    title: 'Réunion institutionnelle',
    date: '14 mai 2026',
    type: 'Institution',
    summary: "Présentation des projets de l'année et accueil des nouveaux travailleurs.",
    decisions: [
      'Deux nouveaux travailleurs rejoignent l\'atelier Espaces verts.',
      'Les horaires du vendredi changent un peu.',
    ],
    actions: [
      { text: 'Informer tous les ateliers des nouveaux horaires', done: true },
    ],
  },
  {
    title: 'Réunion d\'atelier Conditionnement',
    date: '30 avril 2026',
    type: 'Atelier',
    summary: 'Organisation du travail et besoins en matériel.',
    decisions: [
      'De nouveaux gants seront commandés.',
      'Les pauses seront mieux réparties.',
    ],
    actions: [
      { text: 'Commander les gants', done: true },
      { text: 'Afficher le nouveau planning des pauses', done: true },
    ],
  },
]

export default function ComptesRendus() {
  const [selected, setSelected] = useState<number | null>(null)

  if (selected !== null) {
    const r = REPORTS[selected]
    return (
      <div style={{ maxWidth: 760 }}>
        <button
          onClick={() => setSelected(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 16, fontWeight: 600, color: C.primary,
          }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 22 }} /> Retour à la liste
        </button>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>
          {r.title}
        </h2>
        <div style={{ fontSize: 16, color: C.sub, marginBottom: 24 }}>{r.date}</div>

        <Card style={{ marginBottom: 18, background: C.light, border: 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 6 }}>EN RÉSUMÉ</div>
          <p style={{ fontSize: 18, color: C.ink, margin: 0, lineHeight: 1.5 }}>{r.summary}</p>
        </Card>

        <h3 style={{ fontSize: 19, fontWeight: 600, color: C.ink, margin: '0 0 12px' }}>Ce qui a été décidé</h3>
        <Card style={{ marginBottom: 18 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {r.decisions.map((d, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 16, color: C.ink, lineHeight: 1.5 }}>
                <i className="ti ti-point-filled" style={{ fontSize: 22, color: C.primary, flexShrink: 0 }} />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Card>

        <h3 style={{ fontSize: 19, fontWeight: 600, color: C.ink, margin: '0 0 12px' }}>Suivi des actions</h3>
        <Card>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {r.actions.map((a, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: C.ink }}>
                <i
                  className={`ti ${a.done ? 'ti-circle-check-filled' : 'ti-circle-dashed'}`}
                  style={{ fontSize: 24, color: a.done ? C.green : C.sub, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{a.text}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: a.done ? C.green : C.sub,
                }}>
                  {a.done ? 'Fait' : 'En cours'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1180 }}>
      <PageIntro
        icon="ti-file-text"
        title="Comptes rendus"
        text="Lisez ce qui a été dit et décidé lors des réunions. Cliquez sur un compte rendu pour le lire."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {REPORTS.map((r, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16,
              padding: 20, cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.mid }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.line }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: 14, background: C.light,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className="ti ti-file-description" style={{ fontSize: 30, color: C.primary }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{r.title}</div>
              <div style={{ fontSize: 15, color: C.sub }}>{r.date}</div>
            </div>
            <i className="ti ti-chevron-right" style={{ fontSize: 26, color: C.sub, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
