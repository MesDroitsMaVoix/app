'use client'

import { useState } from 'react'
import { useAppStore, PersonKind } from '@/store/useAppStore'
import { C, PageIntro, Card, Avatar } from '@/components/ui'

const KIND_LABEL: Record<PersonKind, string> = {
  travailleur: 'Travailleur',
  stagiaire: 'Stagiaire',
  representant: 'Représentant',
}
const KIND_COLOR: Record<PersonKind, string> = {
  travailleur: '#2563EB', // bleu
  stagiaire: '#D97706',   // ambre
  representant: '#7C3AED', // violet
}

export default function GestionPersonnel() {
  const { people, groups, createGroup, deleteGroup, toggleGroupMember, addPerson, deletePerson, setPage } = useAppStore()
  const [newName, setNewName] = useState('')
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  // add-person form
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [pName, setPName] = useState('')
  const [pAtelier, setPAtelier] = useState('')
  const [pKind, setPKind] = useState<PersonKind>('travailleur')

  // delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  // generated code shown after creating an account
  const [newAccount, setNewAccount] = useState<{ name: string; code: string } | null>(null)

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    createGroup(name)
    setNewName('')
  }

  const handleAddPerson = () => {
    const name = pName.trim()
    if (!name) return
    const code = addPerson({ name, atelier: pAtelier.trim() || 'Non précisé', kind: pKind })
    setPName(''); setPAtelier(''); setPKind('travailleur'); setShowAddPerson(false)
    setNewAccount({ name, code })
  }

  const personById = (id: string) => people.find((p) => p.id === id)

  return (
    <div style={{ maxWidth: 1180 }}>
      <PageIntro
        icon="ti-users-group"
        title="Gestion du personnel"
        text="Créez des groupes de personnes, gérez leurs membres, puis assignez-les aux réunions depuis l'agenda."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 22, alignItems: 'start' }}>
        {/* ---------- Groups ---------- */}
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: '0 0 14px' }}>Groupes</h3>

          {/* Create group */}
          <Card style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <i className="ti ti-plus" style={{ fontSize: 22, color: C.primary }} />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              placeholder="Nom du nouveau groupe…"
              aria-label="Nom du nouveau groupe"
              style={{
                flex: 1, padding: '12px 14px', fontSize: 16, borderRadius: 10,
                border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleCreate}
              style={{
                background: C.primary, color: '#fff', border: 'none', borderRadius: 10,
                padding: '12px 18px', fontSize: 16, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Créer
            </button>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map((g) => {
              const isOpen = openGroupId === g.id
              return (
                <Card key={g.id} style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 18 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, background: C.light,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className="ti ti-users" style={{ fontSize: 24, color: C.primary }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{g.name}</div>
                      <div style={{ fontSize: 14, color: C.sub }}>{g.memberIds.length} personne(s)</div>
                    </div>
                    <button
                      onClick={() => setOpenGroupId(isOpen ? null : g.id)}
                      style={miniBtn(C.primary)}
                    >
                      <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-user-edit'}`} style={{ fontSize: 18 }} />
                      {isOpen ? 'Fermer' : 'Membres'}
                    </button>
                    <button
                      onClick={() => deleteGroup(g.id)}
                      aria-label={`Supprimer ${g.name}`}
                      style={{
                        width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.line}`,
                        background: '#fff', color: '#dc2626', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <i className="ti ti-trash" style={{ fontSize: 20 }} />
                    </button>
                  </div>

                  {/* Member chips */}
                  {g.memberIds.length > 0 && !isOpen && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 18px 18px' }}>
                      {g.memberIds.map((id) => {
                        const p = personById(id)
                        if (!p) return null
                        return (
                          <span key={id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999,
                            padding: '5px 12px 5px 6px', fontSize: 14, color: C.ink,
                          }}>
                            <Avatar initials={p.initials} size={24} />
                            {p.name}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Editing member list */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${C.line}`, padding: 14, background: C.bg }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, margin: '0 0 10px', textTransform: 'uppercase' }}>
                        Cochez les personnes du groupe
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                        {people.map((p) => {
                          const inGroup = g.memberIds.includes(p.id)
                          return (
                            <button
                              key={p.id}
                              onClick={() => toggleGroupMember(g.id, p.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                                border: `1px solid ${inGroup ? C.primary : C.line}`,
                                background: inGroup ? C.light : '#fff',
                              }}
                            >
                              <i
                                className={`ti ${inGroup ? 'ti-square-check-filled' : 'ti-square'}`}
                                style={{ fontSize: 22, color: inGroup ? C.primary : C.sub, flexShrink: 0 }}
                              />
                              <Avatar initials={p.initials} size={30} />
                              <span style={{ fontSize: 14, color: C.ink, lineHeight: 1.2 }}>
                                {p.name}
                                <span style={{ display: 'block', fontSize: 12, color: C.sub }}>{p.atelier}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        {/* ---------- People directory ---------- */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 14px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: 0 }}>
              Personnel ({people.length})
            </h3>
            <button onClick={() => setShowAddPerson((v) => !v)} style={miniBtn(C.primary)}>
              <i className={`ti ${showAddPerson ? 'ti-x' : 'ti-user-plus'}`} style={{ fontSize: 18 }} />
              {showAddPerson ? 'Fermer' : 'Ajouter'}
            </button>
          </div>

          {/* Add-person form */}
          {showAddPerson && (
            <Card style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10, border: `2px solid ${C.primary}` }}>
              <input
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPerson() }}
                placeholder="Nom et prénom"
                aria-label="Nom de la personne"
                style={personField}
              />
              <input
                value={pAtelier}
                onChange={(e) => setPAtelier(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPerson() }}
                placeholder="Atelier ou rôle (ex : Atelier Cuisine)"
                aria-label="Atelier ou rôle"
                style={personField}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                {(Object.keys(KIND_LABEL) as PersonKind[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setPKind(k)}
                    style={{
                      flex: 1, padding: '8px 6px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      border: `1px solid ${pKind === k ? KIND_COLOR[k] : C.line}`,
                      background: pKind === k ? KIND_COLOR[k] : '#fff', color: pKind === k ? '#fff' : C.ink,
                    }}
                  >
                    {KIND_LABEL[k]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddPerson}
                style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
              >
                Ajouter au personnel
              </button>
            </Card>
          )}

          <Card style={{ padding: 8 }}>
            {people.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 12px', borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
              }}>
                <Avatar initials={p.initials} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{p.name}</div>
                  {(() => {
                    const memberOf = groups.filter((g) => g.memberIds.includes(p.id))
                    if (memberOf.length === 0) {
                      return <div style={{ fontSize: 13, color: C.sub, fontStyle: 'italic' }}>Aucun groupe</div>
                    }
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                        {memberOf.map((g) => (
                          <span key={g.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 12, fontWeight: 600, color: C.primary,
                            background: C.light, borderRadius: 999, padding: '2px 9px',
                          }}>
                            <i className="ti ti-users" style={{ fontSize: 13 }} />
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  background: KIND_COLOR[p.kind], padding: '3px 10px', borderRadius: 999,
                }}>
                  {KIND_LABEL[p.kind]}
                </span>
                <button
                  onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
                  aria-label={`Supprimer ${p.name}`}
                  style={{
                    width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.line}`,
                    background: '#fff', color: '#dc2626', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 18 }} />
                </button>
              </div>
            ))}
          </Card>

          <button
            onClick={() => setPage('agenda')}
            style={{
              marginTop: 16, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: C.primary, color: '#fff', border: 'none', borderRadius: 12,
              padding: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <i className="ti ti-calendar-plus" style={{ fontSize: 22 }} />
            Assigner aux réunions (Agenda)
          </button>
        </div>
      </div>

      {/* Generated-code dialog (shown after creating an account) */}
      {newAccount && (
        <div
          onClick={() => setNewAccount(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Compte créé"
            style={{
              background: '#fff', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)', textAlign: 'center',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: C.light, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-user-check" style={{ fontSize: 34, color: C.primary }} />
            </div>
            <h3 style={{ fontSize: 21, fontWeight: 600, color: C.ink, margin: '0 0 8px' }}>
              Compte créé pour {newAccount.name}
            </h3>
            <p style={{ fontSize: 16, color: C.sub, margin: '0 0 18px', lineHeight: 1.5 }}>
              Donnez ce code à la personne pour sa <strong>première connexion</strong>.
              Elle pourra le changer ensuite dans ses paramètres.
            </p>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, letterSpacing: '0.3em',
              color: C.primary, background: C.light, borderRadius: 14, padding: '14px 0', marginBottom: 22,
            }}>
              {newAccount.code}
            </div>
            <button
              onClick={() => setNewAccount(null)}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: C.primary, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}
            >
              J&apos;ai noté le code
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-label="Confirmer la suppression"
            style={{
              background: '#fff', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)', textAlign: 'center',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 34, color: '#dc2626' }} />
            </div>
            <h3 style={{ fontSize: 21, fontWeight: 600, color: C.ink, margin: '0 0 8px' }}>
              Supprimer cette personne ?
            </h3>
            <p style={{ fontSize: 16, color: C.sub, margin: '0 0 24px', lineHeight: 1.5 }}>
              Voulez-vous vraiment retirer <strong style={{ color: C.ink }}>{confirmDelete.name}</strong> du
              personnel ? Cette personne sera aussi retirée de tous les groupes et réunions.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.line}`,
                  background: '#fff', color: C.ink, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => { deletePerson(confirmDelete.id); setConfirmDelete(null) }}
                style={{
                  flex: 1, padding: 14, borderRadius: 12, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const personField: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 10,
  border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

function miniBtn(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 14px', borderRadius: 10, border: `1px solid ${color}`,
    background: '#fff', color, fontSize: 14, fontWeight: 600, cursor: 'pointer',
    flexShrink: 0, whiteSpace: 'nowrap',
  }
}
