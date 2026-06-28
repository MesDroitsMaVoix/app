'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { uploadAttachment } from '@/app/actions'
import { C, PageIntro, Card, Avatar } from '@/components/ui'
import { biometricAvailable, enrollBiometric, getBiometricEntry, clearBiometric } from '@/lib/biometric'

const ROLE_LABEL = {
  admin: 'Administrateur',
  travailleur: 'Travailleur',
} as const

const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 4)

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function Parametres() {
  const { accounts, currentAccountId, people, changeCode, updatePerson, persist } = useAppStore()
  const me = accounts.find((a) => a.id === currentAccountId)
  const myPerson = people.find((p) => p.id === me?.personId)

  const [code, setCode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fonction, setFonction] = useState(myPerson?.fonction ?? '')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Biometric unlock (Option A): only in configured mode, on a device with a
  // usable sensor, tracked per logged-in account.
  const [bioSupported, setBioSupported] = useState(false)
  const [bioEnabled, setBioEnabled] = useState(false)
  const [bioBusy, setBioBusy] = useState(false)

  useEffect(() => {
    let alive = true
    biometricAvailable().then((ok) => { if (alive) setBioSupported(ok) })
    const entry = getBiometricEntry()
    setBioEnabled(!!entry && entry.accountId === currentAccountId)
    return () => { alive = false }
  }, [currentAccountId])

  const toggleBiometric = async () => {
    if (bioBusy) return
    setBioBusy(true)
    setMessage(null)
    try {
      if (bioEnabled) {
        clearBiometric()
        setBioEnabled(false)
        setMessage({ type: 'ok', text: 'Déverrouillage biométrique désactivé sur cet appareil.' })
      } else {
        const ok = await enrollBiometric(me!.id, me!.name)
        setBioEnabled(ok)
        setMessage(ok
          ? { type: 'ok', text: 'Déverrouillage biométrique activé sur cet appareil.' }
          : { type: 'err', text: "L'activation a été annulée ou n'est pas disponible." })
      }
    } finally {
      setBioBusy(false)
    }
  }

  if (!me) return null

  const save = () => {
    if (code.length !== 4) { setMessage({ type: 'err', text: 'Le code doit avoir 4 chiffres.' }); return }
    if (code !== confirm) { setMessage({ type: 'err', text: 'Les deux codes sont différents.' }); return }
    changeCode(me.id, code)
    setCode(''); setConfirm('')
    setMessage({ type: 'ok', text: 'Votre code a bien été modifié.' })
  }

  const onPhoto = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !myPerson) return
    setPhotoBusy(true)
    try {
      let url: string | null = null
      if (persist) {
        const fd = new FormData()
        fd.append('file', file)
        url = (await uploadAttachment(fd))?.url ?? null
      }
      if (!url) url = await fileToDataUrl(file)
      updatePerson(myPerson.id, { photoUrl: url })
    } catch {
      setMessage({ type: 'err', text: "L'envoi de la photo a échoué." })
    } finally {
      setPhotoBusy(false)
    }
  }

  const saveFonction = () => {
    if (myPerson) updatePerson(myPerson.id, { fonction: fonction.trim() })
    setMessage({ type: 'ok', text: 'Votre profil a été mis à jour.' })
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <PageIntro
        icon="ti-settings"
        title="Paramètres"
        text="Gérez votre profil, votre photo et votre code d'accès."
      />

      {/* Profile */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Avatar initials={me.initials} size={64} src={myPerson?.photoUrl} />
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Changer la photo"
              title="Changer la photo"
              disabled={photoBusy}
              style={{
                position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%',
                border: '2px solid #fff', background: C.primary, color: '#fff', cursor: photoBusy ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <i className={`ti ${photoBusy ? 'ti-loader-2' : 'ti-camera'}`} style={{ fontSize: 14 }} />
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(e) => { onPhoto(e.target.files); e.target.value = '' }} style={{ display: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: C.ink }}>{me.name}</div>
            <div style={{ fontSize: 15, color: C.primary, fontWeight: 600 }}>{ROLE_LABEL[me.role]}</div>
            {myPerson?.fonction && <div style={{ fontSize: 14, color: C.sub }}>{myPerson.fonction}</div>}
          </div>
        </div>

        {myPerson && (
          <div style={{ marginTop: 18, borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
              Ma fonction dans l&apos;ESAT (optionnel)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                placeholder="Ex : Cuisinier, Agent d'entretien…"
                style={{ flex: 1, padding: '11px 13px', fontSize: 15, borderRadius: 10, border: `1px solid ${C.line}`, outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={saveFonction} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        )}
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

      {/* Biometric unlock — convenience login on this device */}
      {persist && bioSupported && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: C.light, color: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-fingerprint" style={{ fontSize: 24 }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>
                Déverrouillage biométrique
              </h3>
              <p style={{ fontSize: 15, color: C.sub, margin: 0, lineHeight: 1.4 }}>
                {bioEnabled
                  ? 'Activé sur cet appareil : connectez-vous avec Face ID ou votre empreinte, sans retaper le code.'
                  : 'Activez Face ID ou votre empreinte sur cet appareil pour vous connecter sans retaper le code.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleBiometric}
            disabled={bioBusy}
            style={{
              marginTop: 16, width: '100%', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 600,
              cursor: bioBusy ? 'wait' : 'pointer',
              border: bioEnabled ? `1px solid ${C.line}` : 'none',
              background: bioEnabled ? '#fff' : C.primary,
              color: bioEnabled ? '#DC2626' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <i className={`ti ${bioBusy ? 'ti-loader-2' : bioEnabled ? 'ti-lock-open' : 'ti-fingerprint'}`} style={{ fontSize: 20 }} />
            {bioBusy ? 'Patientez…' : bioEnabled ? 'Désactiver sur cet appareil' : 'Activer sur cet appareil'}
          </button>
        </Card>
      )}
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
