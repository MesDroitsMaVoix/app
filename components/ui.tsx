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

/* Big readable page intro */
export function PageIntro({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600,
        color: C.ink, margin: '0 0 8px',
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: 34, color: C.primary }} />
        {title}
      </h2>
      <p style={{ fontSize: 18, color: C.sub, margin: 0, lineHeight: 1.5, maxWidth: 760 }}>
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

/* Colored avatar with initials */
export function Avatar({ initials, size = 48 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.mid, color: C.primaryDark,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}
