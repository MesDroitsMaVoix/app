'use client'

import { useState } from 'react'
import {
  useAppStore, isPersonInEvent, ateliersLedBy, isCvsDelegate, cvsMemberIds, CURRENT_USER_ID, canManage,
  AgendaEvent, EventType,
} from '@/store/useAppStore'
import { C, Card } from '@/components/ui'
import { useIsMobile } from '@/lib/useIsMobile'

/** A meeting a worker (chef d'atelier / délégué CVS) is allowed to create. */
type EventTarget = { id: string; label: string; type: EventType; recipientIds: string[]; titlePlaceholder: string; atelierId?: string }

const TYPE_COLORS: Record<EventType, string> = {
  CVS:         '#FF6B5E', // corail
  Atelier:     '#2563EB', // bleu
  Institution: '#D97706', // ambre
  Mixte:       '#7C3AED', // violet
}
const TYPES: EventType[] = ['CVS', 'Atelier', 'Institution', 'Mixte']

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const TODAY = '2026-06-18'

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function Agenda() {
  const { role, events, groups, ateliers, people, accounts, currentAccountId, addEvent, deleteEvent, toggleEventGroup } = useAppStore()
  const isMobile = useIsMobile()
  const isStaff = canManage(role)

  // The person whose agenda a travailleur sees (their linked directory id)
  const viewerId = accounts.find((a) => a.id === currentAccountId)?.personId ?? CURRENT_USER_ID

  // Meetings a worker may create: their ateliers (as chef/suppléant) and, if a
  // CVS délégué/suppléant, CVS pre-meetings and the CVS itself.
  const myAteliers = ateliersLedBy(viewerId, ateliers)
  const cvsDelegate = isCvsDelegate(viewerId, groups)
  const targets: EventTarget[] = isStaff
    ? []
    : [
        ...myAteliers.map((a) => ({
          id: a.id, label: a.name, type: 'Atelier' as EventType,
          recipientIds: a.memberIds, titlePlaceholder: `Réunion ${a.name}`, atelierId: a.id,
        })),
        ...(cvsDelegate
          ? [
              { id: 'cvs-prep', label: 'Préréunion de préparation (CVS)', type: 'CVS' as EventType, recipientIds: cvsMemberIds(groups), titlePlaceholder: 'Préréunion de préparation' },
              { id: 'cvs-meet', label: 'Réunion CVS (convoquer le CVS)', type: 'CVS' as EventType, recipientIds: people.map((p) => p.id), titlePlaceholder: 'Conseil de la Vie Sociale (CVS)' },
            ]
          : []),
      ]
  const canCreate = isStaff || targets.length > 0
  const canDeleteEvent = (e: AgendaEvent): boolean =>
    isStaff || e.authorId === viewerId

  const [view, setView] = useState({ year: 2026, month: 5 })
  const [selected, setSelected] = useState<string>(TODAY)
  const [showForm, setShowForm] = useState(false)

  // Travailleur only sees events assigned to them
  const visibleEvents = isStaff
    ? events
    : events.filter((e) => isPersonInEvent(e, viewerId, groups, ateliers))

  const { year, month } = view
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsOn = (d: string) => visibleEvents.filter((e) => e.date === d)
  const selectedEvents = eventsOn(selected)

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setView({ year: y, month: m })
  }

  const selDate = new Date(selected)
  const selLabel = `${WEEKDAYS[(selDate.getDay() + 6) % 7]}. ${selDate.getDate()} ${MONTHS[selDate.getMonth()]}`

  // How many people are reached by an event (direct + via groups)
  const reachCount = (e: AgendaEvent) =>
    people.filter((p) => isPersonInEvent(e, p.id, groups, ateliers)).length

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 22, height: isMobile ? 'auto' : '100%', alignItems: 'stretch' }}>
      {/* Calendar */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? 16 : 24, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 28, fontWeight: 600, color: C.ink, margin: 0 }}>
            {MONTHS[month]} {year}
          </h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => changeMonth(-1)} aria-label="Mois précédent" style={navBtn}>
              <i className="ti ti-chevron-left" style={{ fontSize: 24 }} />
            </button>
            <button
              onClick={() => { setView({ year: 2026, month: 5 }); setSelected(TODAY) }}
              style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.line}`, background: C.bg, fontSize: 15, fontWeight: 600, color: C.ink, cursor: 'pointer' }}
            >
              Aujourd&apos;hui
            </button>
            <button onClick={() => changeMonth(1)} aria-label="Mois suivant" style={navBtn}>
              <i className="ti ti-chevron-right" style={{ fontSize: 24 }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: `2px solid ${C.line}` }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: 'center', padding: '0 0 10px', fontSize: 14, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {w}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: isMobile ? 'minmax(56px, auto)' : '1fr' }}>
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} style={{ borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: '#fcfcfb' }} />
            }
            const dateStr = iso(year, month, day)
            const evts = eventsOn(dateStr)
            const isToday = dateStr === TODAY
            const isSelected = dateStr === selected
            return (
              <button
                key={i}
                onClick={() => { setSelected(dateStr); setShowForm(false) }}
                style={{
                  position: 'relative', textAlign: 'left', cursor: 'pointer', border: 'none',
                  borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
                  background: isSelected ? C.light : '#fff', padding: isMobile ? 5 : 8, minWidth: 0, minHeight: isMobile ? 56 : 78,
                  display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden',
                  outline: isSelected ? `2px solid ${C.primary}` : 'none', outlineOffset: -2,
                }}
              >
                <span style={{
                  alignSelf: 'flex-start', width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: isToday ? 700 : 500,
                  background: isToday ? C.primary : 'transparent', color: isToday ? '#fff' : C.ink,
                }}>
                  {day}
                </span>
                {isMobile ? (
                  // Narrow cells: colored dots (the day's details show in the side panel).
                  evts.length > 0 && (
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 'auto' }}>
                      {evts.slice(0, 4).map((e, j) => (
                        <span key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[e.type] }} />
                      ))}
                    </span>
                  )
                ) : (
                  <>
                    {evts.slice(0, 2).map((e, j) => (
                      <span key={j} style={{
                        maxWidth: '100%', fontSize: 11, fontWeight: 600, color: '#fff', background: TYPE_COLORS[e.type],
                        borderRadius: 5, padding: '2px 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {e.time} {e.type}
                      </span>
                    ))}
                    {evts.length > 2 && (
                      <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>+{evts.length - 2} autre(s)</span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Side panel */}
      <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: isMobile ? 'visible' : 'auto' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selected === TODAY ? "Aujourd'hui" : 'Sélection'}
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: C.ink, margin: '2px 0 0', textTransform: 'capitalize' }}>
            {selLabel}
          </h3>
        </div>

        {/* Admin or chef d'atelier: add a meeting */}
        {canCreate && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: C.primary, color: '#fff', border: 'none', borderRadius: 12,
              padding: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <i className="ti ti-calendar-plus" style={{ fontSize: 22 }} />
            {isStaff ? 'Nouvelle réunion' : 'Organiser une réunion'}
          </button>
        )}

        {canCreate && showForm && (
          <EventForm
            date={selected}
            authorId={viewerId}
            targets={isStaff ? undefined : targets}
            onCancel={() => setShowForm(false)}
            onCreate={(e) => { addEvent(e); setShowForm(false) }}
          />
        )}

        {/* Events of the day */}
        {selectedEvents.length === 0 ? (
          <Card style={{ textAlign: 'center', color: C.sub, padding: 28 }}>
            <i className="ti ti-coffee" style={{ fontSize: 34, color: C.mid, display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 16 }}>
              {isStaff ? 'Aucune réunion ce jour.' : "Pas de réunion pour vous ce jour."}
            </div>
          </Card>
        ) : (
          selectedEvents.map((e) => (
            <Card key={e.id} style={{ padding: 18, borderLeft: `5px solid ${TYPE_COLORS[e.type]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#fff',
                  background: TYPE_COLORS[e.type], padding: '3px 10px', borderRadius: 999, marginBottom: 8,
                }}>
                  {e.type}
                </div>
                {canDeleteEvent(e) && (
                  <button
                    onClick={() => deleteEvent(e.id)}
                    aria-label="Supprimer la réunion"
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 20 }} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: e.atelierId ? 4 : 8 }}>{e.title}</div>
              {e.atelierId && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.primaryDark, background: C.light, borderRadius: 999, padding: '3px 10px', marginBottom: 10 }}>
                  <i className="ti ti-tools" style={{ fontSize: 14 }} />
                  {ateliers.find((a) => a.id === e.atelierId)?.name ?? 'Atelier'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, color: C.sub }}>
                <span><i className="ti ti-clock" style={{ verticalAlign: '-2px', marginRight: 6, color: C.primary }} />{e.time}</span>
                <span><i className="ti ti-map-pin" style={{ verticalAlign: '-2px', marginRight: 6, color: C.primary }} />{e.place}</span>
              </div>

              {isStaff ? (
                <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 8, textTransform: 'uppercase' }}>
                    Assigner à un groupe
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {groups.map((g) => {
                      const on = e.groupIds.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleEventGroup(e.id, g.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 600,
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
                  <div style={{ marginTop: 10, fontSize: 14, color: C.primary, fontWeight: 600 }}>
                    <i className="ti ti-users" style={{ verticalAlign: '-2px', marginRight: 6 }} />
                    {reachCount(e)} personne(s) prévenue(s)
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 12, fontSize: 14, color: C.primary, fontWeight: 600 }}>
                  <i className="ti ti-user-check" style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  Vous êtes attendu(e)
                </div>
              )}
            </Card>
          ))
        )}

        {/* Legend */}
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 10, textTransform: 'uppercase' }}>Légende</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TYPES.map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: C.ink }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: TYPE_COLORS[t], flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ---------- New-event form ---------- */

function EventForm({
  date, onCreate, onCancel, authorId, targets,
}: {
  date: string
  onCreate: (e: Omit<AgendaEvent, 'id'>) => void
  onCancel: () => void
  authorId: string
  /** When set, the form is scoped to what a worker may create (their ateliers
   * and/or CVS pre-meetings + CVS). Undefined = admin full form. */
  targets?: EventTarget[]
}) {
  const groups = useAppStore((s) => s.groups)
  const scoped = targets !== undefined

  const [title, setTitle] = useState('')
  const [time, setTime] = useState('14h00')
  const [place, setPlace] = useState('')
  const [type, setType] = useState<EventType>('CVS')
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [targetId, setTargetId] = useState<string>(targets?.[0]?.id ?? '')

  const toggle = (id: string) =>
    setGroupIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))

  const selectedTarget = targets?.find((t) => t.id === targetId)

  const submit = () => {
    if (!title.trim()) return
    if (scoped) {
      if (!selectedTarget) return
      onCreate({
        date, time, place: place.trim() || 'À définir', title: title.trim(),
        type: selectedTarget.type, personIds: selectedTarget.recipientIds, groupIds: [], authorId,
        atelierId: selectedTarget.atelierId,
      })
    } else {
      onCreate({ date, time, place: place.trim() || 'À définir', title: title.trim(), type, personIds: [], groupIds, authorId })
    }
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '11px 13px', fontSize: 15, borderRadius: 10,
    border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, border: `2px solid ${C.primary}` }}>
      <div style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>
        {scoped ? 'Organiser une réunion' : 'Nouvelle réunion'} · {date.split('-').reverse().join('/')}
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={selectedTarget?.titlePlaceholder ?? 'Titre de la réunion'} aria-label="Titre" style={field} />

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Heure" aria-label="Heure" style={{ ...field, width: 110 }} />
        <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Lieu" aria-label="Lieu" style={field} />
      </div>

      {scoped ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, margin: '2px 0 8px', textTransform: 'uppercase' }}>Type de réunion</div>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            aria-label="Type de réunion"
            style={{ ...field, fontWeight: 600, cursor: 'pointer', background: '#fff' }}
          >
            {targets!.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          {selectedTarget && (
            <div style={{ marginTop: 8, fontSize: 14, color: C.primary, fontWeight: 600 }}>
              <i className="ti ti-users" style={{ verticalAlign: '-2px', marginRight: 6 }} />
              {selectedTarget.recipientIds.length} personne(s) prévenue(s)
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  border: `1px solid ${type === t ? TYPE_COLORS[t] : C.line}`,
                  background: type === t ? TYPE_COLORS[t] : '#fff', color: type === t ? '#fff' : C.ink,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, margin: '2px 0 8px', textTransform: 'uppercase' }}>Qui est concerné ?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {groups.map((g) => {
                const on = groupIds.includes(g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => toggle(g.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
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
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={submit}
          style={{ flex: 1, background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
        >
          Ajouter à l&apos;agenda
        </button>
        <button
          onClick={onCancel}
          style={{ background: '#fff', color: C.sub, border: `1px solid ${C.line}`, borderRadius: 10, padding: '13px 18px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
    </Card>
  )
}

const navBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.line}`,
  background: C.bg, color: C.ink, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
