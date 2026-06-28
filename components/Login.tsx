'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { C } from '@/components/ui'
import { getBiometricEntry, verifyBiometric, clearBiometric, type BiometricEntry } from '@/lib/biometric'

const ROLE_LABEL = {
  admin: 'Administrateur',
  travailleur: 'Travailleur',
} as const

type Phase = 'enter' | 'create' | 'confirm'

export default function Login() {
  const { accounts, persist, login, changeCode, signInAccount, biometricLogin } = useAppStore()

  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? '')
  const [phase, setPhase] = useState<Phase>('enter')
  const [pin, setPin] = useState('')
  const [createdPin, setCreatedPin] = useState('')
  const [error, setError] = useState('')
  const [bioEntry, setBioEntry] = useState<BiometricEntry | null>(null)
  const [bioBusy, setBioBusy] = useState(false)

  const selected = accounts.find((a) => a.id === selectedId)

  // Pick up a biometric enrollment for an account that still exists, and
  // pre-select it so the unlock matches the chosen account.
  useEffect(() => {
    if (!persist) return
    const entry = getBiometricEntry()
    if (entry && accounts.some((a) => a.id === entry.accountId)) {
      setBioEntry(entry)
      setSelectedId(entry.accountId)
    } else {
      setBioEntry(null)
    }
  }, [persist, accounts])

  const unlockWithBiometric = async () => {
    if (!bioEntry || bioBusy) return
    setBioBusy(true)
    setError('')
    try {
      const ok = await verifyBiometric(bioEntry)
      if (!ok) { setError('Reconnaissance échouée. Réessayez ou entrez votre code.'); return }
      const res = await biometricLogin(bioEntry.accountId, bioEntry.token)
      if (!res.ok) {
        // Token revoked / expired (e.g. secret rotated) → drop the enrollment.
        clearBiometric()
        setBioEntry(null)
        setError('Déverrouillage expiré. Entrez votre code pour vous reconnecter.')
      }
    } finally {
      setBioBusy(false)
    }
  }

  // Only offer biometric on the account it was enrolled for, during normal login.
  const canUseBiometric = !!bioEntry && bioEntry.accountId === selectedId && phase === 'enter'
  // First login = no code yet. In configured mode the code is never sent to the
  // client, so we rely on the `hasCode` flag; in demo mode on `code === null`.
  const isFirstLogin = (a?: typeof selected) => (persist ? a != null && !a.hasCode : a?.code === null)

  useEffect(() => {
    setPhase(isFirstLogin(selected) ? 'create' : 'enter')
    setPin(''); setCreatedPin(''); setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected, persist])

  const complete = async (value: string) => {
    if (!selected) return
    if (phase === 'enter') {
      if (persist) {
        const res = await signInAccount(selected.id, value)
        if (!res.ok) { setError('Code incorrect. Réessayez.'); setPin('') }
      } else if (value === selected.code) {
        login(selected.id)
      } else { setError('Code incorrect. Réessayez.'); setPin('') }
    } else if (phase === 'create') {
      setCreatedPin(value); setPin(''); setError(''); setPhase('confirm')
    } else {
      if (value === createdPin) {
        if (persist) {
          const res = await signInAccount(selected.id, value)
          if (!res.ok) { setError('Échec de la connexion. Réessayez.'); setCreatedPin(''); setPin(''); setPhase('create') }
        } else {
          changeCode(selected.id, value); login(selected.id)
        }
      } else { setError('Les deux codes sont différents.'); setCreatedPin(''); setPin(''); setPhase('create') }
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
      {/* Brand — logo in its real colours + establishment name */}
      <div className="login-brand">
        <LogoMark />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, margin: '18px 0 0', lineHeight: 1.1, color: C.ink }}>
          Mes Droits,<br /><span style={{ color: C.primary }}>Ma Voix</span>
        </h1>
        <div style={{
          marginTop: 20, padding: '8px 18px', borderRadius: 999,
          background: C.light, border: `1px solid ${C.primary}33`,
          fontSize: 16, fontWeight: 700, color: C.primaryDark,
        }}>
          ESAT COS Regain
        </div>
        <p style={{ marginTop: 16, fontSize: 15, color: C.sub, maxWidth: 280, lineHeight: 1.5 }}>
          Mes droits et ma parole en ESAT.
        </p>
      </div>

      <div className="login-divider" />

      {/* Form — blended onto the light page, no card */}
      <div className="login-form">
        <h2 style={{
          fontFamily: 'var(--font-main)', fontSize: 14, fontWeight: 700, color: C.sub,
          textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 18px',
        }}>
          Connexion
        </h2>

        <label htmlFor="account" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
          Votre compte
        </label>
        <select
          id="account"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            width: '100%', padding: '13px 13px', fontSize: 16, borderRadius: 11,
            border: `1px solid ${C.line}`, background: '#fff', color: C.ink,
            fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box', marginBottom: 18,
          }}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name} — {ROLE_LABEL[a.role]}</option>
          ))}
        </select>

        <p style={{ textAlign: 'center', fontSize: 14, color: C.sub, margin: '0 0 14px', lineHeight: 1.35 }}>
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
              border: `2px solid ${i < pin.length ? C.primary : '#CBD5E1'}`,
            }} />
          ))}
        </div>

        {/* Error line (reserved height) */}
        <div style={{ minHeight: 20, textAlign: 'center', marginBottom: 8 }}>
          {error && <span style={{ color: '#DC2626', fontSize: 13, fontWeight: 700 }}>{error}</span>}
        </div>

        {/* Biometric unlock — only when this account has enrolled on this device */}
        {canUseBiometric && (
          <button
            onClick={unlockWithBiometric}
            disabled={bioBusy}
            style={{
              width: '100%', marginBottom: 14, padding: '13px 16px', borderRadius: 12,
              border: `1px solid ${C.primary}`, background: C.light, color: C.primaryDark,
              fontSize: 16, fontWeight: 700, cursor: bioBusy ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <i className={`ti ${bioBusy ? 'ti-loader-2' : 'ti-fingerprint'}`} style={{ fontSize: 22 }} />
            {bioBusy ? 'Vérification…' : 'Déverrouiller avec la biométrie'}
          </button>
        )}

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
  )
}

/** Porte-Voix mark in its brand colours. */
function LogoMark() {
  return (
    <svg width="92" height="78" viewBox="-64 -42 130 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M-44,-18 L8,-32 a9,9 0 0 1 11,8 V24 a9,9 0 0 1 -11,8 L-44,18 Z" fill="#FF6B5E" />
      <rect x="-56" y="-18" width="14" height="36" rx="6" fill="#1E293B" />
      <path d="M-31,21 v14 a10,10 0 0 0 16,0 v-8 Z" fill="#FF6B5E" />
      <g stroke="#16A34A" strokeWidth="5" strokeLinecap="round" fill="none">
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
        height: 52, borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff',
        color: C.ink, fontSize: 23, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.background = C.light }}
      onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = '#fff'; el.style.borderColor = C.line
      }}
    >
      {children}
    </button>
  )
}
