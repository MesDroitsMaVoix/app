'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { C, PageIntro, Card, Avatar } from '@/components/ui'

const ROLE_LABEL = {
  travailleur: 'Travailleur',
  representant: 'Représentant',
  accompagnateur: 'Accompagnateur',
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

  const field: React.CSSProperties = {
    width: '100%', padding: '14px 16px', fontSize: 22, letterSpacing: '0.3em', textAlign: 'center',
    borderRadius: 12, border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
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

        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
          Nouveau code
        </label>
        <input
          value={code}
          onChange={(e) => { setCode(onlyDigits(e.target.value)); setMessage(null) }}
          inputMode="numeric"
          type="password"
          autoComplete="off"
          placeholder="••••"
          aria-label="Nouveau code"
          style={{ ...field, marginBottom: 14 }}
        />

        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
          Confirmez le code
        </label>
        <input
          value={confirm}
          onChange={(e) => { setConfirm(onlyDigits(e.target.value)); setMessage(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') save() }}
          inputMode="numeric"
          type="password"
          autoComplete="off"
          placeholder="••••"
          aria-label="Confirmez le code"
          style={field}
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
