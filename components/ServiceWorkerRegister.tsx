'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // L'enregistrement échoue silencieusement (ex: contexte non sécurisé)
      })
    }
  }, [])

  return null
}
