'use client'

import React from 'react'

/* Shared design tokens — Porte-Voix brand, high-contrast for accessibility */
export const C = {
  primary: '#FF6B5E',      // corail — couleur signature, boutons principaux
  primaryDark: '#EE5A4D',  // corail foncé (survol)
  light: '#FFE9E6',        // surface corail très claire (états actifs, puces)
  mid: '#FFC7C0',          // corail clair (avatars)
  blue: '#2563EB',         // bleu confiance — liens, actions secondaires
  green: '#16A34A',        // vert participation — validations, « fait »
  greenLight: '#DCFCE7',   // surface verte claire
  ink: '#1E293B',          // encre — texte principal
  sub: '#64748B',          // ardoise — texte secondaire
  line: '#E2E8F0',         // bordure
  bg: '#F8FAFC',           // brume — fonds de page
}

/* Read-aloud button (text-to-speech via the browser's Web Speech API).
 * `getText` is called on click so the latest content is read. */
export function ReadAloud({ getText, label = 'Lire à haute voix' }: { getText: () => string; label?: string }) {
  const [speaking, setSpeaking] = React.useState(false)
  const [supported, setSupported] = React.useState(true)

  React.useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel() }
  }, [])

  if (!supported) return null

  const toggle = () => {
    const synth = window.speechSynthesis
    if (speaking) { synth.cancel(); setSpeaking(false); return }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(getText())
    u.lang = 'fr-FR'
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(u)
  }

  return (
    <button
      onClick={toggle}
      aria-label={speaking ? 'Arrêter la lecture' : label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        padding: '10px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 15, fontWeight: 600,
        border: `1px solid ${speaking ? C.primary : C.line}`,
        background: speaking ? C.primary : '#fff', color: speaking ? '#fff' : C.primaryDark,
      }}
    >
      <i className={`ti ${speaking ? 'ti-player-stop-filled' : 'ti-volume'}`} style={{ fontSize: 20 }} />
      {speaking ? 'Arrêter' : label}
    </button>
  )
}

/* Big readable page intro */
export function PageIntro({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 600,
        color: C.ink, margin: '0 0 8px',
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: 'clamp(26px, 7vw, 34px)', color: C.primary, flexShrink: 0 }} />
        {title}
      </h2>
      <p style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', color: C.sub, margin: 0, lineHeight: 1.5, maxWidth: 760 }}>
        {text}
      </p>
    </div>
  )
}

/* White rounded card */
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      padding: 22,
      boxShadow: '0 1px 3px rgba(30,41,59,0.05)',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* Avatar colour is picked from the brand palette by initials, so the UI
 * uses the whole palette instead of one pale tint. */
const AVATAR_COLORS = ['#FF6B5E', '#2563EB', '#16A34A', '#1E293B', '#7C3AED', '#D97706']
function avatarColor(initials: string): string {
  let h = 0
  for (let i = 0; i < initials.length; i++) h = (h * 31 + initials.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

/* Colored avatar with initials, or a profile photo when `src` is provided. */
export function Avatar({ initials, size = 48, src }: { initials: string; size?: number; src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: C.line }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(initials), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}
