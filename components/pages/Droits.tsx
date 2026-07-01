'use client'

import { useState } from 'react'
import { useAppStore, PageId } from '@/store/useAppStore'
import { C, PageIntro, Card, ReadAloud } from '@/components/ui'

/* ---------------- Data ---------------- */

interface Droit {
  icon: string
  title: string
  short: string
  details: string[]
}

const DROITS: Droit[] = [
  {
    icon: 'ti-coin-euro',
    title: 'Une rémunération garantie',
    short: 'Vous êtes payé chaque mois, et c\'est protégé.',
    details: [
      'Votre rémunération est garantie entre 55,7 % et 110,7 % du SMIC.',
      "Une partie vient de l'ESAT, l'autre de l'État (aide au poste).",
      'Elle est maintenue pendant vos congés payés.',
    ],
  },
  {
    icon: 'ti-beach',
    title: 'Des congés et du repos',
    short: 'Vous avez droit à des vacances et à des pauses.',
    details: [
      'Au moins 30 jours de congés payés par an (2,5 jours par mois).',
      'Des congés spéciaux pour les événements familiaux (mariage, naissance, décès).',
      'Des temps de pause protégés pendant la journée.',
    ],
  },
  {
    icon: 'ti-school',
    title: 'Le droit de vous former',
    short: 'Vous pouvez apprendre et faire reconnaître vos compétences.',
    details: [
      'Accès à des formations professionnelles adaptées.',
      "La VAE (Validation des Acquis de l'Expérience) permet d'obtenir un diplôme.",
      'La RSFP reconnaît officiellement vos savoir-faire professionnels.',
    ],
  },
  {
    icon: 'ti-heart-handshake',
    title: 'Un accompagnement personnalisé',
    short: 'Votre travail est adapté à vos besoins.',
    details: [
      'Un projet personnalisé construit avec vous et revu régulièrement.',
      'Un poste et un rythme adaptés à vos capacités.',
      'Un soutien médico-social au quotidien.',
    ],
  },
  {
    icon: 'ti-speakerphone',
    title: 'Vous exprimer et être représenté',
    short: 'Vous pouvez donner votre avis et être écouté.',
    details: [
      'Vous élisez vos représentants au Conseil de la Vie Sociale (CVS).',
      'Vous pouvez vous présenter pour devenir délégué.',
      'Vous pouvez proposer des idées et poser vos questions.',
    ],
  },
  {
    icon: 'ti-scale',
    title: 'De nouveaux droits, comme les salariés',
    short: 'Depuis 2023, vos droits se rapprochent de ceux des salariés.',
    details: [
      'Une mutuelle santé prise en charge en partie.',
      "Le droit d'adhérer à un syndicat et le droit de grève.",
      "Des chèques-vacances et le remboursement d'une partie des transports.",
    ],
  },
  {
    icon: 'ti-shield-check',
    title: 'Le respect et la dignité',
    short: 'Vous êtes traité avec respect, en sécurité.',
    details: [
      'Une charte protège votre dignité et votre liberté.',
      'La maltraitance est interdite : vous pouvez signaler sans crainte.',
      'Vos informations personnelles restent confidentielles.',
    ],
  },
  {
    icon: 'ti-briefcase',
    title: 'Aller vers le milieu ordinaire',
    short: 'Vous pouvez découvrir le travail en entreprise.',
    details: [
      "Des stages ou une mise à disposition en entreprise sont possibles.",
      'Vous êtes accompagné dans ce projet si vous le souhaitez.',
      "Vous gardez votre place à l'ESAT si cela ne convient pas (droit au retour).",
    ],
  },
]

interface StructureItem {
  icon: string
  color: string
  title: string
  text: string
}

const STRUCTURE: StructureItem[] = [
  { icon: 'ti-user-heart', color: '#FF6B5E', title: 'Les travailleurs (vous)', text: "Vous travaillez dans un atelier avec un accompagnement adapté à vos besoins." },
  { icon: 'ti-tools', color: '#2563EB', title: "Le moniteur d'atelier", text: "Aussi appelé chef d'atelier. Il encadre le travail, apprend les gestes et organise l'atelier." },
  { icon: 'ti-heart-handshake', color: '#16A34A', title: "L'équipe d'accompagnement", text: "Éducateurs, psychologue, assistante sociale… Ils vous aident au quotidien et veillent à votre bien-être." },
  { icon: 'ti-building-community', color: '#7C3AED', title: 'La direction', text: "Elle dirige l'établissement, gère le budget et prend les décisions importantes." },
  { icon: 'ti-users-group', color: '#D97706', title: 'Les instances', text: "Des lieux où vous pouvez vous exprimer et être représenté (voir l'onglet « Les instances »)." },
]

interface Instance {
  icon: string
  color: string
  name: string
  role: string
  who: string
  purpose: string
}

const INSTANCES: Instance[] = [
  {
    icon: 'ti-users', color: '#FF6B5E',
    name: 'Le Conseil de la Vie Sociale (CVS)',
    role: "L'instance principale pour donner son avis sur la vie dans l'ESAT.",
    who: 'Des travailleurs élus, des représentants des familles, du personnel et la direction.',
    purpose: 'Parler des repas, des activités, du règlement, des projets et de la sécurité.',
  },
  {
    icon: 'ti-user-star', color: '#2563EB',
    name: 'Les délégués des travailleurs',
    role: 'Des travailleurs élus qui portent vos demandes à la direction.',
    who: 'Élus parmi les travailleurs de l\'établissement.',
    purpose: 'Transmettre vos questions et vos propositions à la direction.',
  },
  {
    icon: 'ti-arrows-exchange', color: '#16A34A',
    name: "L'instance mixte",
    role: 'Un temps d\'échange entre travailleurs et professionnels.',
    who: 'Des travailleurs, des moniteurs, des accompagnateurs et la direction.',
    purpose: 'Discuter ensemble des sujets communs et préparer des décisions.',
  },
  {
    icon: 'ti-building', color: '#7C3AED',
    name: 'La réunion institutionnelle',
    role: "Une réunion d'information pour tout l'établissement.",
    who: "Toute l'équipe et les travailleurs.",
    purpose: "Annoncer les nouveautés, les projets et l'accueil des nouveaux arrivants.",
  },
  {
    icon: 'ti-clipboard-text', color: '#D97706',
    name: "La réunion d'atelier",
    role: 'La réunion de votre atelier.',
    who: "Les travailleurs de l'atelier et le moniteur.",
    purpose: 'Organiser le travail, le matériel et les plannings de l\'atelier.',
  },
]

interface LoiItem {
  icon: string
  title: string
  text: string
  source: string
}

const LOIS: LoiItem[] = [
  {
    icon: 'ti-building-hospital',
    title: "L'ESAT est un établissement médico-social",
    text: "Ce n'est pas une entreprise ordinaire. C'est un établissement qui accompagne par le travail des personnes en situation de handicap.",
    source: "Code de l'action sociale et des familles (CASF), article L.344-2",
  },
  {
    icon: 'ti-file-certificate',
    title: 'Un contrat de soutien et d\'aide par le travail',
    text: "Le travailleur signe un « contrat de soutien et d'aide par le travail », et non un contrat de travail classique. Il ne peut pas être licencié comme dans une entreprise ordinaire.",
    source: 'CASF, articles L.311-4 et R.243-4',
  },
  {
    icon: 'ti-coin-euro',
    title: 'Une rémunération garantie',
    text: "Le travailleur perçoit une rémunération garantie comprise entre 55,7 % et 110,7 % du SMIC (une partie payée par l'ESAT, une partie par l'État).",
    source: 'CASF, article R.243-5',
  },
  {
    icon: 'ti-beach',
    title: 'Le droit aux congés payés',
    text: "Le travailleur a droit à des congés payés : au moins 2,5 jours par mois, soit 30 jours par an.",
    source: 'Code du travail, article L.3141-3 (appliqué aux ESAT)',
  },
  {
    icon: 'ti-speakerphone',
    title: "Le droit à l'expression et à la représentation",
    text: "Chaque établissement doit permettre aux personnes accueillies de participer et d'être représentées, notamment grâce au Conseil de la Vie Sociale (CVS).",
    source: 'Loi n°2002-2 du 2 janvier 2002 ; CASF, articles D.311-3 et suivants',
  },
  {
    icon: 'ti-list-check',
    title: 'La charte des droits et libertés',
    text: "Une charte protège la dignité, le respect et la liberté de la personne accueillie. Un projet personnalisé et un livret d'accueil vous sont aussi remis.",
    source: 'Loi n°2002-2 du 2 janvier 2002 ; arrêté du 8 septembre 2003',
  },
  {
    icon: 'ti-scale',
    title: 'De nouveaux droits proches de ceux des salariés',
    text: "Depuis 2023, les travailleurs d'ESAT ont de nouveaux droits : mutuelle prise en charge, droit d'adhérer à un syndicat, droit de grève, chèques-vacances, remboursement d'une partie des transports.",
    source: "Loi n°2023-1196 du 18 décembre 2023 ; décret n°2022-1561 du 13 décembre 2022",
  },
  {
    icon: 'ti-accessible',
    title: "L'égalité des droits et la non-discrimination",
    text: "La loi garantit l'égalité des droits et des chances, la participation et la citoyenneté des personnes handicapées.",
    source: 'Loi n°2005-102 du 11 février 2005',
  },
]

/* ---------------- Tabs ---------------- */

type TabId = 'droits' | 'esat' | 'instances' | 'loi'
const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'droits',    icon: 'ti-star',        label: 'Mes droits' },
  { id: 'esat',      icon: 'ti-building',    label: 'Mon ESAT' },
  { id: 'instances', icon: 'ti-users-group', label: 'Les instances' },
  { id: 'loi',       icon: 'ti-gavel',       label: 'La loi' },
]

function tabText(tab: TabId): string {
  if (tab === 'droits') {
    return ['Mes droits.', ...DROITS.map((d) => `${d.title}. ${d.short} ${d.details.join('. ')}`)].join(' ')
  }
  if (tab === 'esat') {
    return [
      "Mon ESAT. L'ESAT, Établissement et Service d'Accompagnement par le Travail, est un lieu de travail adapté. On y travaille avec un accompagnement. C'est un établissement médico-social.",
      ...STRUCTURE.map((s) => `${s.title}. ${s.text}`),
    ].join(' ')
  }
  if (tab === 'instances') {
    return [
      'Les instances sont des réunions et des groupes où vous pouvez vous exprimer et participer.',
      ...INSTANCES.map((i) => `${i.name}. C'est quoi ? ${i.role} Qui participe ? ${i.who} À quoi ça sert ? ${i.purpose}`),
    ].join(' ')
  }
  return [
    "La loi. Voici quelques points importants de la loi pour les travailleurs d'ESAT.",
    ...LOIS.map((l) => `${l.title}. ${l.text} Source : ${l.source}.`),
  ].join(' ')
}

export default function Droits() {
  const [tab, setTab] = useState<TabId>('droits')

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageIntro
        icon="ti-book-2"
        title="Mes droits"
        text="Comprenez vos droits, comment votre ESAT est organisé, et où vous pouvez vous exprimer — avec des mots simples."
      />

      {/* Tabs + read-aloud */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 26, alignItems: 'center' }}>
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 18px', borderRadius: 999, cursor: 'pointer',
                fontSize: 16, fontWeight: 600,
                border: `1px solid ${active ? C.primary : C.line}`,
                background: active ? C.primary : '#fff',
                color: active ? '#fff' : C.ink,
              }}
            >
              <i className={`ti ${t.icon}`} style={{ fontSize: 20 }} />
              {t.label}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto' }}>
          <ReadAloud getText={() => tabText(tab)} label="Lire à voix haute" />
        </div>
      </div>

      {tab === 'droits' && <MesDroits />}
      {tab === 'esat' && <MonEsat />}
      {tab === 'instances' && <LesInstances />}
      {tab === 'loi' && <LaLoi />}
    </div>
  )
}

/* ---------------- Sections ---------------- */

function MesDroits() {
  const [open, setOpen] = useState<number | null>(0)
  const setPage = useAppStore((s) => s.setPage)

  const cta: { page: PageId; icon: string; label: string }[] = [
    { page: 'agenda', icon: 'ti-calendar-event', label: 'Voir les réunions' },
    { page: 'comptes', icon: 'ti-file-text', label: 'Lire les comptes rendus' },
    { page: 'representants', icon: 'ti-users', label: 'Mes représentants' },
  ]

  return (
    <div>
      {/* Invitation to participate */}
      <div style={{ background: C.primary, color: '#fff', borderRadius: 18, padding: '24px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <i className="ti ti-hand-love-you" style={{ fontSize: 30 }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, margin: 0 }}>
            Votre voix compte — investissez-vous !
          </h3>
        </div>
        <p style={{ fontSize: 17, lineHeight: 1.5, margin: '0 0 18px', color: 'rgba(255,255,255,0.92)', maxWidth: 720 }}>
          Vos droits ne servent vraiment que si vous les faites vivre. Venez aux réunions, votez, proposez vos idées,
          et surtout <strong>informez-vous</strong> : plus vous participez, plus votre ESAT vous ressemble.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {cta.map((c) => (
            <button
              key={c.page}
              onClick={() => setPage(c.page)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff', color: C.primaryDark, border: 'none', borderRadius: 12,
                padding: '11px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <i className={`ti ${c.icon}`} style={{ fontSize: 19 }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: '0 0 14px' }}>Vos droits concrets</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 14, alignItems: 'start' }}>
      {DROITS.map((d, i) => {
        const isOpen = open === i
        return (
          <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 54, height: 54, borderRadius: 14, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${d.icon}`} style={{ fontSize: 30, color: C.primary }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 600, color: C.ink }}>{d.title}</div>
                <div style={{ fontSize: 16, color: C.sub, lineHeight: 1.4 }}>{d.short}</div>
              </div>
              <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 26, color: C.sub, flexShrink: 0 }} />
            </button>
            {isOpen && (
              <div style={{ padding: '0 20px 20px', paddingLeft: 'clamp(20px, 6vw, 90px)' }}>
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

function MonEsat() {
  return (
    <div style={{ maxWidth: 820 }}>
      <Card style={{ marginBottom: 18, background: C.light, border: 'none' }}>
        <p style={{ fontSize: 18, color: C.ink, margin: 0, lineHeight: 1.55 }}>
          L&apos;<strong>ESAT</strong> (Établissement et Service d&apos;Accompagnement par le Travail) est un lieu de
          travail adapté. On y travaille <strong>avec un accompagnement</strong>. Ce n&apos;est pas une entreprise
          ordinaire : c&apos;est un <strong>établissement médico-social</strong>.
        </p>
      </Card>

      <h3 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: '0 0 14px' }}>Qui fait quoi dans mon ESAT ?</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STRUCTURE.map((s, i) => (
          <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${s.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 28, color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{s.title}</div>
              <div style={{ fontSize: 16, color: C.sub, lineHeight: 1.45 }}>{s.text}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function LesInstances() {
  return (
    <div>
      <Card style={{ marginBottom: 18, background: C.light, border: 'none' }}>
        <p style={{ fontSize: 18, color: C.ink, margin: 0, lineHeight: 1.55 }}>
          Les <strong>instances</strong> sont des réunions et des groupes où vous pouvez <strong>vous exprimer</strong>,{' '}
          <strong>être représenté</strong> et <strong>participer aux décisions</strong>. Voici les principales.
        </p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 14, alignItems: 'start' }}>
        {INSTANCES.map((ins, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${ins.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${ins.icon}`} style={{ fontSize: 28, color: ins.color }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{ins.name}</div>
            </div>
            <InfoRow icon="ti-info-circle" label="C'est quoi ?" text={ins.role} />
            <InfoRow icon="ti-users" label="Qui participe ?" text={ins.who} />
            <InfoRow icon="ti-target" label="À quoi ça sert ?" text={ins.purpose} />
          </Card>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 20, color: C.primary, flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.45 }}>
        <span style={{ fontWeight: 700 }}>{label} </span>
        <span style={{ color: C.sub }}>{text}</span>
      </div>
    </div>
  )
}

function LaLoi() {
  return (
    <div style={{ maxWidth: 900 }}>
      <Card style={{ marginBottom: 18, background: C.light, border: 'none' }}>
        <p style={{ fontSize: 17, color: C.ink, margin: 0, lineHeight: 1.55 }}>
          Voici quelques <strong>points importants de la loi </strong> pour les travailleurs d&apos;ESAT, expliqués
          simplement. Chaque point indique <strong>sa source officielle</strong>.
        </p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 14, alignItems: 'start' }}>
        {LOIS.map((l, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: C.bg, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${l.icon}`} style={{ fontSize: 26, color: C.primary }} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{l.title}</div>
                <p style={{ fontSize: 15, color: C.ink, margin: '0 0 10px', lineHeight: 1.5 }}>{l.text}</p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <i className="ti ti-bookmark" style={{ fontSize: 15, color: C.blue, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: C.blue, fontWeight: 600, lineHeight: 1.4 }}>{l.source}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p style={{ fontSize: 13, color: C.sub, marginTop: 18, lineHeight: 1.5, fontStyle: 'italic' }}>
        Ces informations sont simplifiées et données à titre indicatif. Elles ne remplacent pas un conseil juridique.
        Pour toute question précise, parlez-en à votre accompagnateur, à vos représentants ou à la direction.
      </p>
    </div>
  )
}
