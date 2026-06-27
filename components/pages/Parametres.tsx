'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { C, PageIntro, Card, Avatar } from '@/components/ui'

const ROLE_LABEL = {
  admin: 'Administrateur',
  travailleur: 'Travailleur',
} as const

const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 4)

export default function Parametres() {
  const { accounts, currentAccountId, changeCode } = useAppStore()
  const me = accounts.find((a) => a.id === currentAccountId)

  const [code, setCode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  if (!me) return null

  const save = () => {
    if (code.length !== 4) { setMessage({ type: 'err', text: 'Le code doit avoir 4 chiffres.' }); return }
    if (code !== confirm) { setMessage({ type: 'err', text: 'Les deux codes sont différents.' }); return }
    changeCode(me.id, code)
    setCode(''); setConfirm('')
    setMessage({ type: 'ok', text: 'Votre code a bien été modifié.' })
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <PageIntro
        icon="ti-settings"
        title="Paramètres"
        text="Gérez votre compte et votre code d'accès."
      />

      {/* Profile */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Avatar initials={me.initials} size={56} />
        <div>
          <div style={{ fontSize: 19, fontWeight: 600, color: C.ink }}>{me.name}</div>
          <div style={{ fontSize: 15, color: C.primary, fontWeight: 600 }}>{ROLE_LABEL[me.role]}</div>
        </div>
      </Card>

      {/* Change code */}
      <Card>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>Changer mon code</h3>
        <p style={{ fontSize: 15, color: C.sub, margin: '0 0 18px', lineHeight: 1.4 }}>
          Choisissez un nouveau code à 4 chiffres. Vous l&apos;utiliserez à votre prochaine connexion.
        </p>

        <div style={{ marginBottom: 16 }}>
          <PinField
            label="Nouveau code"
            value={code}
            onChange={(v) => { setCode(v); setMessage(null) }}
          />
        </div>

        <PinField
          label="Confirmez le code"
          value={confirm}
          onChange={(v) => { setConfirm(v); setMessage(null) }}
          onComplete={save}
        />

        {message && (
          <div style={{
            marginTop: 16, padding: '12px 14px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            background: message.type === 'ok' ? C.greenLight : '#FEE2E2',
            color: message.type === 'ok' ? C.green : '#DC2626',
          }}>
            <i className={`ti ${message.type === 'ok' ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ fontSize: 20 }} />
            {message.text}
          </div>
        )}

        <button
          onClick={save}
          style={{
            marginTop: 20, width: '100%', background: C.primary, color: '#fff', border: 'none',
            borderRadius: 12, padding: 15, fontSize: 17, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Enregistrer le nouveau code
        </button>
      </Card>
    </div>
  )
}

/** Four-box code field: always shows 4 slots so it's clear that 4 digits
 * are expected. A hidden numeric input captures the typing. */
function PinField({
  label, value, onChange, onComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onComplete?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = (raw: string) => {
    const v = onlyDigits(raw)
    onChange(v)
    if (v.length === 4) onComplete?.()
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{ position: 'relative', display: 'flex', gap: 10, cursor: 'text' }}
      >
        {[0, 1, 2, 3].map((i) => {
          const filled = i < value.length
          return (
            <div key={i} style={{
              flex: 1, height: 56, borderRadius: 12,
              border: `1px solid ${filled ? C.primary : C.line}`,
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {filled && <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.primary }} />}
            </div>
          )
        })}
        {/* Transparent input on top to capture keystrokes */}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.length === 4) onComplete?.() }}
          inputMode="numeric"
          autoComplete="off"
          aria-label={label}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, border: 'none', background: 'transparent', cursor: 'text',
          }}
        />
      </div>
    </div>
  )
}
