'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { C } from '@/components/ui'

const ROLE_LABEL = {
  travailleur: 'Travailleur',
  representant: 'Représentant',
  accompagnateur: 'Accompagnateur',
} as const

type Phase = 'enter' | 'create' | 'confirm'

export default function Login() {
  const { accounts, login, changeCode } = useAppStore()

  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? '')
  const [phase, setPhase] = useState<Phase>('enter')
  const [pin, setPin] = useState('')
  const [createdPin, setCreatedPin] = useState('')
  const [error, setError] = useState('')

  const selected = accounts.find((a) => a.id === selectedId)

  // When the account changes, decide whether a code already exists.
  useEffect(() => {
    setPhase(selected && selected.code === null ? 'create' : 'enter')
    setPin(''); setCreatedPin(''); setError('')
  }, [selectedId, selected])

  const complete = (value: string) => {
    if (!selected) return
    if (phase === 'enter') {
      if (value === selected.code) login(selected.id)
      else { setError('Code incorrect. Réessayez.'); setPin('') }
    } else if (phase === 'create') {
      setCreatedPin(value); setPin(''); setError(''); setPhase('confirm')
    } else {
      if (value === createdPin) { changeCode(selected.id, value); login(selected.id) }
      else { setError('Les deux codes sont différents.'); setCreatedPin(''); setPin(''); setPhase('create') }
    }
  }

  const onDigit = (d: string) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError('')
    if (next.length === 4) setTimeout(() => complete(next), 110)
  }
  const onDelete = () => { setPin((p) => p.slice(0, -1)); setError('') }

  return (
    <div className="login-wrap">
      {/* Branding panel */}
      <div className="login-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.18)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LogoMark />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, margin: 0, lineHeight: 1.1 }}>
            Mes Droits,<br />Ma Voix
          </h1>
        </div>
        <p style={{ fontSize: 20, lineHeight: 1.5, color: 'rgba(255,255,255,0.92)', maxWidth: 420, margin: 0 }}>
          Votre espace pour comprendre vos droits, suivre les réunions et parler à vos représentants.
        </p>
      </div>

      {/* Login panel (off-centered to the right) */}
      <div className="login-panel">
        <div style={{
          background: '#fff', borderRadius: 20, padding: 26, width: '100%', maxWidth: 340,
          boxShadow: '0 16px 44px rgba(0,0,0,0.18)', boxSizing: 'border-box',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: C.ink, margin: '0 0 18px' }}>
            Connexion
          </h2>

          {/* Account selector */}
          <label htmlFor="account" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
            Votre compte
          </label>
          <select
            id="account"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              width: '100%', padding: '12px 13px', fontSize: 16, borderRadius: 10,
              border: `1px solid ${C.line}`, background: C.bg, color: C.ink,
              fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box', marginBottom: 16,
            }}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {ROLE_LABEL[a.role]}</option>
            ))}
          </select>

          {/* Instruction */}
          <p style={{ textAlign: 'center', fontSize: 14, color: C.sub, margin: '0 0 12px', lineHeight: 1.35 }}>
            {phase === 'enter'   && 'Entrez votre code à 4 chiffres'}
            {phase === 'create'  && 'Première connexion : choisissez votre code'}
            {phase === 'confirm' && 'Confirmez votre code'}
          </p>

          {/* Pin dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: i < pin.length ? C.primary : 'transparent',
                border: `2px solid ${i < pin.length ? C.primary : '#d6d3d1'}`,
              }} />
            ))}
          </div>

          {/* Error line (reserved height) */}
          <div style={{ minHeight: 20, textAlign: 'center', marginBottom: 6 }}>
            {error && <span style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</span>}
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <KeyButton key={d} onClick={() => onDigit(d)}>{d}</KeyButton>
            ))}
            <div />
            <KeyButton onClick={() => onDigit('0')}>0</KeyButton>
            <KeyButton onClick={onDelete} aria-label="Effacer">
              <i className="ti ti-backspace" style={{ fontSize: 22 }} />
            </KeyButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The Porte-Voix megaphone mark, drawn in white for the coral panel. */
function LogoMark() {
  return (
    <svg width="44" height="40" viewBox="-64 -40 130 85" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M-44,-18 L8,-32 a9,9 0 0 1 11,8 V24 a9,9 0 0 1 -11,8 L-44,18 Z" fill="#fff" />
      <rect x="-56" y="-18" width="14" height="36" rx="6" fill="#fff" opacity="0.85" />
      <path d="M-31,21 v14 a10,10 0 0 0 16,0 v-8 Z" fill="#fff" />
      <g stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M29,-21 q11,4 11,21" />
        <path d="M40,-32 q21,8 21,32" />
      </g>
    </svg>
  )
}

function KeyButton({
  children, onClick, ...rest
}: { children: React.ReactNode; onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      {...rest}
      style={{
        height: 48, borderRadius: 12, border: `1px solid ${C.line}`, background: C.bg,
        color: C.ink, fontSize: 22, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.background = C.light }}
      onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.background = C.bg }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.bg }}
    >
      {children}
    </button>
  )
}
