'use client'

import { useState } from 'react'
import { useAppStore, canManage, isPersonInScope, CURRENT_USER_ID, Report, ReportAction, EventType, Group, Person } from '@/store/useAppStore'
import { C, PageIntro, Card, Avatar } from '@/components/ui'

const TYPE_COLORS: Record<EventType, string> = {
  CVS:         '#FF6B5E',
  Atelier:     '#2563EB',
  Institution: '#D97706',
  Mixte:       '#7C3AED',
}
const TYPES: EventType[] = ['CVS', 'Atelier', 'Institution', 'Mixte']

export default function ComptesRendus() {
  const { role, reports, groups, people, accounts, currentAccountId, addReport, updateReport, deleteReport } = useAppStore()
  const isStaff = canManage(role)

  // Travailleur only sees reports they have access to
  const viewerId = accounts.find((a) => a.id === currentAccountId)?.personId ?? CURRENT_USER_ID
  const visibleReports = isStaff ? reports : reports.filter((r) => isPersonInScope(r, viewerId, groups))

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Report | null>(null)

  /* ---------- Editor ---------- */
  if (editingId !== null) {
    const initial = editingId === 'new' ? null : reports.find((r) => r.id === editingId) ?? null
    return (
      <ReportEditor
        initial={initial}
        groups={groups}
        people={people}
        onCancel={() => setEditingId(null)}
        onSave={(data) => {
          if (editingId === 'new') addReport(data)
          else updateReport(editingId, data)
          setEditingId(null)
          setSelectedId(null)
        }}
      />
    )
  }

  /* ---------- Detail ---------- */
  if (selectedId !== null) {
    const r = reports.find((x) => x.id === selectedId)
    if (!r) { setSelectedId(null); return null }
    return (
      <div style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <button onClick={() => setSelectedId(null)} style={backBtn}>
            <i className="ti ti-arrow-left" style={{ fontSize: 22 }} /> Retour à la liste
          </button>
          {isStaff && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingId(r.id)} style={ghostBtn(C.blue)}>
                <i className="ti ti-edit" style={{ fontSize: 18 }} /> Modifier
              </button>
              <button onClick={() => setConfirmDelete(r)} style={ghostBtn('#dc2626')}>
                <i className="ti ti-trash" style={{ fontSize: 18 }} /> Supprimer
              </button>
            </div>
          )}
        </div>

        <div style={{
          display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#fff',
          background: TYPE_COLORS[r.type], padding: '3px 10px', borderRadius: 999, marginBottom: 8,
        }}>
          {r.type}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>
          {r.title}
        </h2>
        <div style={{ fontSize: 16, color: C.sub, marginBottom: isStaff ? 12 : 24 }}>{r.date}</div>

        {isStaff && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: C.sub }}>
            <i className="ti ti-eye" style={{ fontSize: 18 }} /> Visible par :
            {r.groupIds.length === 0 && r.personIds.length === 0 && <span style={{ fontStyle: 'italic' }}>personne pour l&apos;instant</span>}
            {r.groupIds.map((gid) => {
              const g = groups.find((x) => x.id === gid)
              if (!g) return null
              return (
                <span key={gid} style={{ background: C.light, color: C.primaryDark, borderRadius: 999, padding: '3px 10px', fontWeight: 600 }}>
                  {g.name}
                </span>
              )
            })}
            {r.personIds.length > 0 && (
              <span style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: '3px 10px', fontWeight: 600 }}>
                +{r.personIds.length} personne(s)
              </span>
            )}
          </div>
        )}

        <Card style={{ marginBottom: 18, background: C.light, border: 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.primaryDark, marginBottom: 6 }}>EN RÉSUMÉ</div>
          <p style={{ fontSize: 18, color: C.ink, margin: 0, lineHeight: 1.5 }}>{r.summary}</p>
        </Card>

        {r.decisions.length > 0 && (
          <>
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
          </>
        )}

        {r.actions.length > 0 && (
          <>
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: a.done ? C.green : C.sub }}>
                      {a.done ? 'Fait' : 'En cours'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        {confirmDelete && (
          <DeleteDialog
            report={confirmDelete}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => { deleteReport(confirmDelete.id); setConfirmDelete(null); setSelectedId(null) }}
          />
        )}
      </div>
    )
  }

  /* ---------- List ---------- */
  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageIntro
          icon="ti-file-text"
          title="Comptes rendus"
          text="Lisez ce qui a été dit et décidé lors des réunions. Cliquez sur un compte rendu pour le lire."
        />
        {isStaff && (
          <button onClick={() => setEditingId('new')} style={primaryBtn}>
            <i className="ti ti-plus" style={{ fontSize: 20 }} /> Nouveau compte rendu
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {visibleReports.length === 0 && (
          <Card style={{ textAlign: 'center', color: C.sub, padding: 30 }}>
            Aucun compte rendu pour le moment.
          </Card>
        )}
        {visibleReports.map((r) => (
          <Card key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18 }}>
            <button
              onClick={() => setSelectedId(r.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer', minWidth: 0,
              }}
            >
              <div style={{
                width: 54, height: 54, borderRadius: 14, background: C.light, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-file-description" style={{ fontSize: 30, color: C.primary }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: TYPE_COLORS[r.type], padding: '2px 8px', borderRadius: 999 }}>
                    {r.type}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{r.title}</div>
                <div style={{ fontSize: 15, color: C.sub }}>{r.date}</div>
              </div>
            </button>

            {isStaff ? (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditingId(r.id)} aria-label="Modifier" style={iconBtn(C.blue)}>
                  <i className="ti ti-edit" style={{ fontSize: 19 }} />
                </button>
                <button onClick={() => setConfirmDelete(r)} aria-label="Supprimer" style={iconBtn('#dc2626')}>
                  <i className="ti ti-trash" style={{ fontSize: 19 }} />
                </button>
              </div>
            ) : (
              <i className="ti ti-chevron-right" style={{ fontSize: 26, color: C.sub, flexShrink: 0 }} />
            )}
          </Card>
        ))}
      </div>

      {confirmDelete && (
        <DeleteDialog
          report={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { deleteReport(confirmDelete.id); setConfirmDelete(null) }}
        />
      )}
    </div>
  )
}

/* ---------- Editor ---------- */

function ReportEditor({
  initial, groups, people, onSave, onCancel,
}: {
  initial: Report | null
  groups: Group[]
  people: Person[]
  onSave: (data: Omit<Report, 'id'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [type, setType] = useState<EventType>(initial?.type ?? 'CVS')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [decisions, setDecisions] = useState<string[]>(initial?.decisions ?? [''])
  const [actions, setActions] = useState<ReportAction[]>(initial?.actions ?? [])
  // New report is visible to everyone by default (all groups)
  const [groupIds, setGroupIds] = useState<string[]>(initial?.groupIds ?? groups.map((g) => g.id))
  const [personIds, setPersonIds] = useState<string[]>(initial?.personIds ?? [])
  const [showPeople, setShowPeople] = useState(false)
  const [error, setError] = useState('')

  const toggleGroup = (id: string) =>
    setGroupIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
  const togglePerson = (id: string) =>
    setPersonIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  // People reached (direct + via groups), for the count
  const reached = people.filter(
    (p) => personIds.includes(p.id) || groupIds.some((gid) => groups.find((g) => g.id === gid)?.memberIds.includes(p.id))
  ).length

  const save = () => {
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    onSave({
      title: title.trim(),
      date: date.trim() || 'Date à préciser',
      type,
      summary: summary.trim(),
      decisions: decisions.map((d) => d.trim()).filter(Boolean),
      actions: actions.map((a) => ({ ...a, text: a.text.trim() })).filter((a) => a.text),
      groupIds,
      personIds,
    })
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 10,
    border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <button onClick={onCancel} style={{ ...backBtn, marginBottom: 18 }}>
        <i className="ti ti-arrow-left" style={{ fontSize: 22 }} /> Annuler
      </button>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: C.ink, margin: '0 0 20px' }}>
        {initial ? 'Modifier le compte rendu' : 'Nouveau compte rendu'}
      </h2>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Labeled label="Titre">
          <input value={title} onChange={(e) => { setTitle(e.target.value); setError('') }} placeholder="Ex : Conseil de la Vie Sociale (CVS)" style={field} />
        </Labeled>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Labeled label="Date" style={{ flex: 1, minWidth: 180 }}>
            <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Ex : 28 mai 2026" style={field} />
          </Labeled>
        </div>

        <Labeled label="Type de réunion">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map((t) => {
              const on = type === t
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    border: `1px solid ${on ? TYPE_COLORS[t] : C.line}`,
                    background: on ? TYPE_COLORS[t] : '#fff', color: on ? '#fff' : C.ink,
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </Labeled>

        <Labeled label="Résumé (en mots simples)">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Ce dont on a parlé, expliqué simplement."
            style={{ ...field, resize: 'vertical', lineHeight: 1.5 }}
          />
        </Labeled>

        {/* Decisions */}
        <Labeled label="Décisions prises">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decisions.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="ti ti-point-filled" style={{ fontSize: 20, color: C.primary, flexShrink: 0 }} />
                <input
                  value={d}
                  onChange={(e) => setDecisions(decisions.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder="Une décision…"
                  style={field}
                />
                <button onClick={() => setDecisions(decisions.filter((_, j) => j !== i))} aria-label="Retirer" style={iconBtn('#dc2626')}>
                  <i className="ti ti-x" style={{ fontSize: 18 }} />
                </button>
              </div>
            ))}
            <button onClick={() => setDecisions([...decisions, ''])} style={addRowBtn}>
              <i className="ti ti-plus" style={{ fontSize: 18 }} /> Ajouter une décision
            </button>
          </div>
        </Labeled>

        {/* Actions */}
        <Labeled label="Suivi des actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setActions(actions.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                  aria-label={a.done ? 'Marquer en cours' : 'Marquer fait'}
                  title={a.done ? 'Fait' : 'En cours'}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                >
                  <i
                    className={`ti ${a.done ? 'ti-circle-check-filled' : 'ti-circle-dashed'}`}
                    style={{ fontSize: 24, color: a.done ? C.green : C.sub }}
                  />
                </button>
                <input
                  value={a.text}
                  onChange={(e) => setActions(actions.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  placeholder="Une action à suivre…"
                  style={field}
                />
                <button onClick={() => setActions(actions.filter((_, j) => j !== i))} aria-label="Retirer" style={iconBtn('#dc2626')}>
                  <i className="ti ti-x" style={{ fontSize: 18 }} />
                </button>
              </div>
            ))}
            <button onClick={() => setActions([...actions, { text: '', done: false }])} style={addRowBtn}>
              <i className="ti ti-plus" style={{ fontSize: 18 }} /> Ajouter une action
            </button>
          </div>
        </Labeled>

        {/* Audience — who can read this report */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18 }}>
          <Labeled label="Qui peut voir ce compte rendu ?">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {groups.map((g) => {
                const on = groupIds.includes(g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999,
                      cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      border: `1px solid ${on ? C.primary : C.line}`,
                      background: on ? C.primary : '#fff', color: on ? '#fff' : C.ink,
                    }}
                  >
                    <i className={`ti ${on ? 'ti-check' : 'ti-plus'}`} style={{ fontSize: 16 }} />
                    {g.name}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowPeople((v) => !v)}
              style={{ ...addRowBtn, marginTop: 10 }}
            >
              <i className={`ti ${showPeople ? 'ti-chevron-up' : 'ti-user-plus'}`} style={{ fontSize: 18 }} />
              {showPeople ? 'Masquer les personnes' : 'Ajouter des personnes précises'}
            </button>

            {showPeople && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8, marginTop: 10 }}>
                {people.map((p) => {
                  const on = personIds.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePerson(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${on ? C.primary : C.line}`, background: on ? C.light : '#fff',
                      }}
                    >
                      <i className={`ti ${on ? 'ti-square-check-filled' : 'ti-square'}`} style={{ fontSize: 22, color: on ? C.primary : C.sub, flexShrink: 0 }} />
                      <Avatar initials={p.initials} size={30} />
                      <span style={{ fontSize: 14, color: C.ink }}>{p.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 14, color: C.primary, fontWeight: 600 }}>
              <i className="ti ti-eye" style={{ verticalAlign: '-2px', marginRight: 6 }} />
              {reached} personne(s) peuvent le voir
            </div>
          </Labeled>
        </div>

        {error && <div style={{ color: '#dc2626', fontSize: 15, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} style={{ ...primaryBtn, flex: 1, justifyContent: 'center' }}>
            <i className="ti ti-check" style={{ fontSize: 20 }} /> Enregistrer
          </button>
          <button onClick={onCancel} style={{ ...ghostBtn(C.sub), padding: '13px 20px' }}>
            Annuler
          </button>
        </div>
      </Card>
    </div>
  )
}

function Labeled({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function DeleteDialog({ report, onConfirm, onCancel }: { report: Report; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-trash" style={{ fontSize: 32, color: '#dc2626' }} />
        </div>
        <h3 style={{ fontSize: 21, fontWeight: 600, color: C.ink, margin: '0 0 8px' }}>Supprimer ce compte rendu ?</h3>
        <p style={{ fontSize: 16, color: C.sub, margin: '0 0 24px', lineHeight: 1.5 }}>
          <strong style={{ color: C.ink }}>{report.title}</strong> sera définitivement supprimé.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- shared button styles ---------- */
const backBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none',
  cursor: 'pointer', fontSize: 16, fontWeight: 600, color: C.primary, padding: 0,
}
const primaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: C.primary, color: '#fff',
  border: 'none', borderRadius: 12, padding: '13px 18px', fontSize: 16, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
}
const addRowBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
  background: C.bg, color: C.primaryDark, border: `1px solid ${C.line}`, borderRadius: 10,
  padding: '9px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
function ghostBtn(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color,
    border: `1px solid ${C.line}`, borderRadius: 10, padding: '9px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  }
}
function iconBtn(color: string): React.CSSProperties {
  return {
    width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.line}`, background: '#fff',
    color, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
