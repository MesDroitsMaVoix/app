'use client'

import { useEffect } from 'react'
import { useAppStore, type PageId } from '@/store/useAppStore'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // L'enregistrement échoue silencieusement (ex: contexte non sécurisé)
    })

    // Quand l'utilisateur tape sur une notification push, le service worker
    // envoie ce message : on ouvre la bonne page (et la conversation).
    const onMessage = (e: MessageEvent) => {
      const d = e.data
      if (!d || d.type !== 'notification-click') return
      const store = useAppStore.getState()
      if (typeof d.convId === 'number') {
        store.setConversation(d.convId)
        store.setPage('messagerie')
      } else if (d.page) {
        store.setPage(d.page as PageId)
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  return null
}
