'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore, DELETE_WINDOW_MS } from '@/store/useAppStore'
import { C, Avatar } from '@/components/ui'

export default function Messagerie() {
  const { conversations, activeConversationId, accounts, currentAccountId, people, setConversation, sendMessage, deleteMessage, startConversation } = useAppStore()
  const [draft, setDraft] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const endRef = useRef<HTMLDivElement>(null)

  // Re-render every 30s so the delete button disappears once the 1h window passes
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Hide the logged-in user from the "new conversation" picker
  const selfName = accounts.find((a) => a.id === currentAccountId)?.name ?? ''
  const candidates = people
    .filter((p) => p.name !== selfName)
    .filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))

  const active = conversations.find((c) => c.id === activeConversationId) ?? conversations[0]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active.messages.length, activeConversationId])

  const handleSend = () => {
    const text = draft.trim()
    if (!text) return
    sendMessage(text)
    setDraft('')
  }

  return (
    <div style={{
      display: 'flex', gap: 0, height: '100%',
      border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', background: '#fff',
    }}>
      {/* Conversation list */}
      <div style={{ width: 280, borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column' }}>
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
          {conversations.map((c) => {
            const isActive = c.id === activeConversationId
            const last = c.messages[c.messages.length - 1]
            return (
              <button
                key={c.id}
                onClick={() => setConversation(c.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  padding: '14px 18px', border: 'none', cursor: 'pointer',
                  background: isActive ? C.light : 'transparent',
                  borderLeft: isActive ? `4px solid ${C.primary}` : '4px solid transparent',
                }}
              >
                <Avatar initials={c.initials} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{c.name}</div>
                  <div style={{
                    fontSize: 13, color: C.sub, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {last ? last.text : c.role}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', borderBottom: `1px solid ${C.line}`,
        }}>
          <Avatar initials={active.initials} size={44} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{active.name}</div>
            <div style={{ fontSize: 14, color: C.primary, fontWeight: 600 }}>{active.role}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: C.bg }}>
          {active.messages.map((m) => {
            const mine = m.from === 'moi'
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
                  maxWidth: '72%', padding: '12px 16px', borderRadius: 16,
                  background: mine ? C.primary : '#fff',
                  color: mine ? '#fff' : C.ink,
                  border: mine ? 'none' : `1px solid ${C.line}`,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                }}>
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
        <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: `1px solid ${C.line}` }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder="Écrivez votre message…"
            aria-label="Écrire un message"
            style={{
              flex: 1, padding: '14px 16px', fontSize: 16, borderRadius: 12,
              border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSend}
            aria-label="Envoyer"
            style={{
              width: 52, height: 52, borderRadius: 12, border: 'none',
              background: C.primary, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <i className="ti ti-send" style={{ fontSize: 24 }} />
          </button>
        </div>
      </div>

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
                      startConversation({ name: p.name, initials: p.initials, role: p.atelier })
                      setPickerOpen(false)
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                      padding: '12px 12px', border: 'none', borderRadius: 12, cursor: 'pointer', background: 'transparent',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.bg }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Avatar initials={p.initials} />
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
    </div>
  )
}
