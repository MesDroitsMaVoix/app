'use client'

import { useState, useRef, useEffect } from 'react'
import {
  useAppStore, DELETE_WINDOW_MS, conversationParticipants, isConversationUnread, appSettings,
  Conversation, Person,
} from '@/store/useAppStore'
import { C, Avatar } from '@/components/ui'
import { useIsMobile } from '@/lib/useIsMobile'

/* Messages can only be sent during working hours (8h30–16h30); reading is
 * always allowed. */
const WORK_START = 8 * 60 + 30  // 8h30
const WORK_END = 16 * 60 + 30   // 16h30
const WORK_LABEL = '8h30 à 16h30'

function isWorkingHours(ts: number): boolean {
  const d = new Date(ts)
  const minutes = d.getHours() * 60 + d.getMinutes()
  return minutes >= WORK_START && minutes <= WORK_END
}

/** Title/avatar of a conversation as seen by the viewer (the *other* person for
 * a direct chat, the atelier name for a group). */
function convDisplay(c: Conversation, viewerId: string, people: Person[]): { name: string; initials: string; isGroup: boolean; photoUrl?: string; deleted?: boolean } {
  if (c.atelierId) return { name: c.name, initials: c.initials, isGroup: true }
  const otherId = (c.participantIds ?? []).find((id) => id !== viewerId)
  const other = people.find((p) => p.id === otherId)
  // The other participant no longer exists (staff member deleted).
  if (!other) return { name: 'Utilisateur supprimé', initials: '?', isGroup: false, deleted: true }
  return { name: other.name, initials: other.initials, isGroup: false, photoUrl: other.photoUrl }
}

export default function Messagerie() {
  const { conversations, activeConversationId, accounts, currentAccountId, people, settings, setConversation, sendMessage, deleteMessage, deleteConversation, startConversation, markConversationRead } = useAppStore()
  const isMobile = useIsMobile()
  // On phones the list and the conversation are two full-screen views (master/detail).
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [draft, setDraft] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmDeleteConv, setConfirmDeleteConv] = useState(false)
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const endRef = useRef<HTMLDivElement>(null)

  // Re-render every 30s so the delete button disappears once the 1h window passes
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Hide the logged-in user from the "new conversation" picker
  const me = accounts.find((a) => a.id === currentAccountId)
  const viewerId = me?.personId ?? ''
  const candidates = people
    .filter((p) => p.id !== viewerId)
    .filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))

  // You only see conversations you take part in (atelier members or DM pair).
  const visibleConversations = conversations.filter((c) => conversationParticipants(c).includes(viewerId))

  const active = visibleConversations.find((c) => c.id === activeConversationId) ?? visibleConversations[0]
  const personName = (id: string) => people.find((p) => p.id === id)?.name ?? 'Utilisateur supprimé'
  const personInitials = (id: string) => people.find((p) => p.id === id)?.initials ?? '?'
  const personPhoto = (id: string) => people.find((p) => p.id === id)?.photoUrl

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length, activeConversationId])

  // Mark the open conversation as read whenever it changes or a message arrives.
  useEffect(() => {
    if (active && viewerId) markConversationRead(active.id, viewerId)
  }, [active?.id, active?.messages.length, viewerId, markConversationRead])

  // Admins can lift the "working hours only" rule; when off, sending is always allowed.
  const restricted = appSettings(settings).messagingRestricted
  const canSend = !restricted || isWorkingHours(now)

  const handleSend = () => {
    if (!canSend || !active || !viewerId) return
    const text = draft.trim()
    if (!text) return
    sendMessage(text, viewerId)
    setDraft('')
  }

  return (
    <div style={{
      display: 'flex', gap: 0, height: '100%',
      border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', background: '#fff',
    }}>
      {/* Conversation list */}
      {(!isMobile || mobileView === 'list') && (
      <div style={{ width: isMobile ? '100%' : 280, borderRight: isMobile ? 'none' : `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '18px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>Mes conversations</span>
          <button
            onClick={() => { setPickerOpen(true); setSearch('') }}
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
            style={{
              width: 38, height: 38, borderRadius: 10, border: 'none',
              background: C.primary, color: '#fff', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ti ti-pencil-plus" style={{ fontSize: 20 }} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {visibleConversations.map((c) => {
            // On mobile the list is a separate view; highlighting the "open" one
            // would leave it stuck in orange after tapping back. Only highlight on desktop.
            const isActive = !isMobile && c.id === activeConversationId
            const last = c.messages[c.messages.length - 1]
            const disp = convDisplay(c, viewerId, people)
            const unread = isConversationUnread(c, viewerId)
            return (
              <button
                key={c.id}
                onClick={() => { setConversation(c.id); setMobileView('chat') }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  padding: '14px 18px', border: 'none', cursor: 'pointer',
                  background: isActive ? C.light : 'transparent',
                  borderLeft: isActive ? `4px solid ${C.primary}` : '4px solid transparent',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar initials={disp.initials} size={44} src={disp.photoUrl} />
                  {unread && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2, width: 13, height: 13,
                      background: C.primary, borderRadius: '50%', border: '2px solid #fff',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {disp.isGroup && <i className="ti ti-users" style={{ fontSize: 15, color: C.sub, flexShrink: 0 }} />}
                    <span style={{ fontSize: 16, fontWeight: unread ? 700 : 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{disp.name}</span>
                  </div>
                  <div style={{
                    fontSize: 13, color: unread ? C.ink : C.sub, fontWeight: unread ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {last ? last.text : c.role}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      )}

      {/* Chat */}
      {(!isMobile || mobileView === 'chat') && (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!active ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, color: C.sub, padding: 24, textAlign: 'center',
          }}>
            <i className="ti ti-message-2" style={{ fontSize: 48, color: C.mid }} />
            <div style={{ fontSize: 16, lineHeight: 1.5 }}>
              Aucune conversation pour l&apos;instant.<br />
              Cliquez sur le bouton <i className="ti ti-pencil-plus" style={{ verticalAlign: '-2px' }} /> pour en démarrer une.
            </div>
          </div>
        ) : (
        <>
        {/* Header */}
        {(() => {
          const disp = convDisplay(active, viewerId, people)
          const members = active.atelierId ? (active.memberIds ?? []) : []
          return (
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isMobile && (
                  <button
                    onClick={() => setMobileView('list')}
                    aria-label="Retour aux conversations"
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      border: `1px solid ${C.line}`, background: C.bg, color: C.ink,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    <i className="ti ti-arrow-left" style={{ fontSize: 22 }} />
                  </button>
                )}
                <Avatar initials={disp.initials} size={44} src={disp.photoUrl} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {disp.isGroup && <i className="ti ti-users" style={{ fontSize: 16, color: C.sub }} />}
                    <span style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{disp.name}</span>
                  </div>
                  <div style={{ fontSize: 14, color: C.primary, fontWeight: 600 }}>
                    {disp.isGroup ? `Atelier · ${members.length} membre(s)` : active.role}
                  </div>
                </div>
                {/* Delete conversation — direct chats only (atelier chats follow their atelier). */}
                {!disp.isGroup && (
                  <button
                    onClick={() => setConfirmDeleteConv(true)}
                    aria-label="Supprimer la conversation"
                    title="Supprimer la conversation"
                    style={{
                      marginLeft: 'auto', width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      border: `1px solid ${C.line}`, background: '#fff', color: '#dc2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 20 }} />
                  </button>
                )}
              </div>

              {/* Group members — so you know who receives the messages */}
              {disp.isGroup && members.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {members.map((mid) => (
                    <span key={mid} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999,
                      padding: '4px 12px 4px 4px', fontSize: 13, color: C.ink,
                    }}>
                      <Avatar initials={personInitials(mid)} size={22} src={personPhoto(mid)} />
                      {personName(mid)}{mid === viewerId ? ' (vous)' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: C.bg }}>
          {active.messages.map((m) => {
            const mine = m.senderId === viewerId
            const canDelete = mine && now - m.sentAt <= DELETE_WINDOW_MS
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'flex-end', gap: 8,
                justifyContent: mine ? 'flex-end' : 'flex-start',
              }}>
                {/* Only own messages, deletable within the last hour */}
                {canDelete && (
                  <button
                    onClick={() => deleteMessage(active.id, m.id)}
                    aria-label="Supprimer ce message"
                    title="Supprimer ce message"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.line}`,
                      background: '#fff', color: '#dc2626', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
                    }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 17 }} />
                  </button>
                )}
                <div style={{
                  maxWidth: '72%', padding: '10px 16px', borderRadius: 16,
                  background: mine ? C.primary : '#fff',
                  color: mine ? '#fff' : C.ink,
                  border: mine ? 'none' : `1px solid ${C.line}`,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                }}>
                  {/* Sender name */}
                  <div style={{
                    fontSize: 12, fontWeight: 700, marginBottom: 3,
                    color: mine ? 'rgba(255,255,255,0.85)' : C.primary,
                  }}>
                    {mine ? 'Moi' : personName(m.senderId)}
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.45 }}>{m.text}</div>
                  <div style={{
                    fontSize: 12, marginTop: 4, textAlign: 'right',
                    color: mine ? 'rgba(255,255,255,0.75)' : C.sub,
                  }}>
                    {m.time}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        {!canSend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderTop: `1px solid ${C.line}`,
            background: '#FEF3C7', color: '#92400E', fontSize: 14, fontWeight: 600, lineHeight: 1.4,
          }}>
            <i className="ti ti-clock-pause" style={{ fontSize: 22, flexShrink: 0 }} />
            <span>
              La messagerie est ouverte de {WORK_LABEL}. Vous pouvez lire vos messages à toute heure,
              mais l&apos;envoi est fermé pour le moment.
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: `1px solid ${C.line}` }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder={canSend ? 'Écrivez votre message…' : `Envoi possible de ${WORK_LABEL}`}
            aria-label="Écrire un message"
            disabled={!canSend}
            style={{
              flex: 1, padding: '14px 16px', fontSize: 16, borderRadius: 12,
              border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit',
              background: canSend ? '#fff' : C.bg, color: canSend ? C.ink : C.sub,
              cursor: canSend ? 'text' : 'not-allowed',
            }}
          />
          <button
            onClick={handleSend}
            aria-label="Envoyer"
            disabled={!canSend}
            title={canSend ? 'Envoyer' : `Envoi possible de ${WORK_LABEL}`}
            style={{
              width: 52, height: 52, borderRadius: 12, border: 'none',
              background: canSend ? C.primary : C.mid, color: '#fff',
              cursor: canSend ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <i className={`ti ${canSend ? 'ti-send' : 'ti-clock-pause'}`} style={{ fontSize: 24 }} />
          </button>
        </div>
        </>
        )}
      </div>
      )}

      {/* New-conversation picker */}
      {pickerOpen && (
        <div
          onClick={() => setPickerOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Choisir une personne"
            style={{
              background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440,
              maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: 20, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: 0 }}>Nouvelle conversation</h3>
                <button
                  onClick={() => setPickerOpen(false)}
                  aria-label="Fermer"
                  style={{ background: 'transparent', border: 'none', color: C.sub, cursor: 'pointer', padding: 0 }}
                >
                  <i className="ti ti-x" style={{ fontSize: 24 }} />
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <i className="ti ti-search" style={{ position: 'absolute', left: 14, top: 13, fontSize: 18, color: C.sub }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une personne…"
                  aria-label="Rechercher une personne"
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', fontSize: 16, borderRadius: 10,
                    border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: 8 }}>
              {candidates.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: C.sub, fontSize: 16 }}>
                  Aucune personne trouvée.
                </div>
              ) : (
                candidates.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      startConversation({ id: p.id, name: p.name, initials: p.initials, role: '' }, viewerId)
                      setPickerOpen(false)
                      setMobileView('chat')
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                      padding: '12px 12px', border: 'none', borderRadius: 12, cursor: 'pointer', background: 'transparent',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.bg }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Avatar initials={p.initials} src={p.photoUrl} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{p.name}</div>
                      <div style={{ fontSize: 14, color: C.sub }}>{p.atelier}</div>
                    </div>
                    <i className="ti ti-message-plus" style={{ fontSize: 22, color: C.primary }} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete-conversation confirmation */}
      {confirmDeleteConv && active && (
        <div
          onClick={() => setConfirmDeleteConv(false)}
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
              Supprimer cette conversation ?
            </h3>
            <p style={{ fontSize: 16, color: C.sub, margin: '0 0 24px', lineHeight: 1.5 }}>
              Tous les messages de cet échange seront définitivement supprimés pour tout le monde.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteConv(false)}
                style={{
                  flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.line}`,
                  background: '#fff', color: C.ink, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => { deleteConversation(active.id); setConfirmDeleteConv(false); setMobileView('list') }}
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
