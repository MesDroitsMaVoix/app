'use client'

import { useState } from 'react'
import { useAppStore, PersonKind } from '@/store/useAppStore'
import { C, PageIntro, Card, Avatar } from '@/components/ui'

const KIND_LABEL: Record<PersonKind, string> = {
  admin: 'Administrateur',
  travailleur: 'Travailleur',
}
const KIND_COLOR: Record<PersonKind, string> = {
  admin: '#7C3AED',       // violet
  travailleur: '#2563EB', // bleu
}

export default function GestionPersonnel() {
  const { people, groups, ateliers, accounts, createGroup, deleteGroup, toggleGroupMember, toggleGroupAtelier, addPerson, deletePerson, regenerateCode, setPage } = useAppStore()
  const accountForPerson = (personId: string) => accounts.find((a) => a.personId === personId)
  const atelierById = (id: string) => ateliers.find((a) => a.id === id)
  const [newName, setNewName] = useState('')
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  // add-person form
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [pName, setPName] = useState('')
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
    const code = addPerson({ name, atelier: 'Non précisé', kind: pKind })
    setPName(''); setPKind('travailleur'); setShowAddPerson(false)
    setNewAccount({ name, code })
  }

  const personById = (id: string) => people.find((p) => p.id === id)

  return (
    <div style={{ maxWidth: 1180 }}>
      <PageIntro
        icon="ti-users-group"
        title="Gestion du personnel"
        text="Désignez les chefs d'atelier et leurs suppléants, créez des groupes, puis assignez les personnes aux réunions depuis l'agenda."
      />

      <AteliersSection />

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
                      <div style={{ fontSize: 14, color: C.sub }}>
                        {g.atelierIds.length > 0 && <>{g.atelierIds.length} atelier(s) · </>}
                        {g.memberIds.length} personne(s)
                      </div>
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

                  {/* Atelier + member chips */}
                  {(g.atelierIds.length > 0 || g.memberIds.length > 0) && !isOpen && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 18px 18px' }}>
                      {g.atelierIds.map((id) => {
                        const a = atelierById(id)
                        if (!a) return null
                        return (
                          <span key={id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: C.light, border: `1px solid ${C.primary}55`, borderRadius: 999,
                            padding: '5px 12px', fontSize: 14, color: C.primaryDark, fontWeight: 600,
                          }}>
                            <i className="ti ti-tools" style={{ fontSize: 15 }} />
                            {a.name}
                          </span>
                        )
                      })}
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
                        Ateliers du groupe
                      </div>
                      {ateliers.length === 0 ? (
                        <div style={{ fontSize: 14, color: C.sub, fontStyle: 'italic', marginBottom: 16 }}>Aucun atelier pour l&apos;instant.</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 16 }}>
                          {ateliers.map((a) => {
                            const inGroup = g.atelierIds.includes(a.id)
                            return (
                              <button
                                key={a.id}
                                onClick={() => toggleGroupAtelier(g.id, a.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                                  padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                                  border: `1px solid ${inGroup ? C.primary : C.line}`,
                                  background: inGroup ? C.light : '#fff',
                                }}
                              >
                                <i className={`ti ${inGroup ? 'ti-square-check-filled' : 'ti-square'}`} style={{ fontSize: 22, color: inGroup ? C.primary : C.sub, flexShrink: 0 }} />
                                <i className="ti ti-tools" style={{ fontSize: 20, color: C.primary, flexShrink: 0 }} />
                                <span style={{ fontSize: 14, color: C.ink, lineHeight: 1.2 }}>
                                  {a.name}
                                  <span style={{ display: 'block', fontSize: 12, color: C.sub }}>{a.memberIds.length} membre(s)</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, margin: '0 0 10px', textTransform: 'uppercase' }}>
                        Personnes ajoutées individuellement
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
                                <span style={{ display: 'block', fontSize: 12, color: C.sub }}>{KIND_LABEL[p.kind]}</span>
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
              <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Type de compte</div>
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
                  onClick={() => {
                    const acc = accountForPerson(p.id)
                    if (acc) setNewAccount({ name: p.name, code: regenerateCode(acc.id) })
                  }}
                  aria-label={`Régénérer le code de ${p.name}`}
                  title="Régénérer le code d'accès"
                  style={{
                    width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.line}`,
                    background: '#fff', color: C.primary, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className="ti ti-key" style={{ fontSize: 18 }} />
                </button>
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
              Code d&apos;accès de {newAccount.name}
            </h3>
            <p style={{ fontSize: 16, color: C.sub, margin: '0 0 18px', lineHeight: 1.5 }}>
              Donnez ce code à la personne pour sa <strong>connexion</strong>.
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

/* ---------- Ateliers (chef + suppléants + membres) ---------- */

function AteliersSection() {
  const {
    people, ateliers, createAtelier, deleteAtelier,
    setAtelierChef, toggleAtelierSuppleant, toggleAtelierMember,
  } = useAppStore()

  const [newName, setNewName] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  // Only travailleurs can be chef, suppléant or member of an atelier.
  const workers = people.filter((p) => p.kind !== 'admin')
  const personById = (id: string) => people.find((p) => p.id === id)
  const openAtelier = openId ? ateliers.find((a) => a.id === openId) ?? null : null

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    createAtelier(name)
    setNewName('')
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: '0 0 14px' }}>
        Ateliers ({ateliers.length})
      </h3>

      {/* Create atelier */}
      <Card style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <i className="ti ti-tools" style={{ fontSize: 22, color: C.primary }} />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          placeholder="Nom du nouvel atelier…"
          aria-label="Nom du nouvel atelier"
          style={{ flex: 1, padding: '12px 14px', fontSize: 16, borderRadius: 10, border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={handleCreate}
          style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', fontSize: 16, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Créer
        </button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {ateliers.map((a) => {
          const chef = a.chefId ? personById(a.chefId) : null
          return (
            <Card key={a.id} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 18 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-tools" style={{ fontSize: 24, color: C.primary }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{a.name}</div>
                  <div style={{ fontSize: 14, color: C.sub }}>
                    {chef ? <>Chef : <strong style={{ color: C.ink }}>{chef.name}</strong></> : <span style={{ fontStyle: 'italic' }}>Aucun chef désigné</span>}
                    {' · '}{a.memberIds.length} membre(s)
                  </div>
                </div>
                <button onClick={() => setOpenId(a.id)} style={miniBtn(C.primary)}>
                  <i className="ti ti-user-edit" style={{ fontSize: 18 }} />
                  Gérer
                </button>
                <button
                  onClick={() => setConfirmDelete({ id: a.id, name: a.name })}
                  aria-label={`Supprimer ${a.name}`}
                  style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.line}`, background: '#fff', color: '#dc2626', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 20 }} />
                </button>
              </div>

              {a.suppleantIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 18px 18px' }}>
                  {a.suppleantIds.map((id) => {
                    const p = personById(id)
                    if (!p) return null
                    return (
                      <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: '5px 12px 5px 6px', fontSize: 13, color: C.ink }}>
                        <Avatar initials={p.initials} size={22} />
                        {p.name}
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>suppléant</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Manage-atelier modal */}
      {openAtelier && (
        <div
          onClick={() => setOpenId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Gérer ${openAtelier.name}`}
            style={{ background: '#fff', borderRadius: 18, padding: 24, maxWidth: 560, width: '100%', margin: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-tools" style={{ fontSize: 24, color: C.primary }} />
              </div>
              <h3 style={{ flex: 1, fontSize: 21, fontWeight: 600, color: C.ink, margin: 0 }}>{openAtelier.name}</h3>
              <button onClick={() => setOpenId(null)} aria-label="Fermer" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.line}`, background: '#fff', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-x" style={{ fontSize: 20 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Chef */}
              <div>
                <div style={subHeading}>Chef d&apos;atelier</div>
                <select
                  value={openAtelier.chefId ?? ''}
                  onChange={(e) => setAtelierChef(openAtelier.id, e.target.value || null)}
                  style={{ width: '100%', padding: '11px 12px', fontSize: 15, borderRadius: 10, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}
                >
                  <option value="">— Aucun chef —</option>
                  {workers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Suppléants */}
              <div>
                <div style={subHeading}>Suppléants (mêmes droits que le chef)</div>
                <PersonToggleGrid
                  workers={workers.filter((p) => p.id !== openAtelier.chefId)}
                  selected={openAtelier.suppleantIds}
                  onToggle={(pid) => toggleAtelierSuppleant(openAtelier.id, pid)}
                />
              </div>

              {/* Membres */}
              <div>
                <div style={subHeading}>Membres de l&apos;atelier</div>
                <PersonToggleGrid
                  workers={workers}
                  selected={openAtelier.memberIds}
                  onToggle={(pid) => toggleAtelierMember(openAtelier.id, pid)}
                />
              </div>
            </div>

            <button
              onClick={() => setOpenId(null)}
              style={{ marginTop: 22, width: '100%', padding: 14, borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
            >
              Terminé
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-label="Confirmer la suppression"
            style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 34, color: '#dc2626' }} />
            </div>
            <h3 style={{ fontSize: 21, fontWeight: 600, color: C.ink, margin: '0 0 8px' }}>Supprimer cet atelier ?</h3>
            <p style={{ fontSize: 16, color: C.sub, margin: '0 0 24px', lineHeight: 1.5 }}>
              <strong style={{ color: C.ink }}>{confirmDelete.name}</strong> sera supprimé. Les comptes rendus déjà rédigés restent, mais ne seront plus reliés à cet atelier.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => { deleteAtelier(confirmDelete.id); setConfirmDelete(null) }} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonToggleGrid({
  workers, selected, onToggle,
}: {
  workers: { id: string; name: string; initials: string }[]
  selected: string[]
  onToggle: (personId: string) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
      {workers.map((p) => {
        const on = selected.includes(p.id)
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${on ? C.primary : C.line}`, background: on ? C.light : '#fff',
            }}
          >
            <i className={`ti ${on ? 'ti-square-check-filled' : 'ti-square'}`} style={{ fontSize: 20, color: on ? C.primary : C.sub, flexShrink: 0 }} />
            <Avatar initials={p.initials} size={26} />
            <span style={{ fontSize: 14, color: C.ink }}>{p.name}</span>
          </button>
        )
      })}
    </div>
  )
}

const subHeading: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: C.sub, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em',
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
