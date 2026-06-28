'use client'

import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import Topbar from '@/components/Topbar'
import Login from '@/components/Login'
import { useAppStore } from '@/store/useAppStore'
import { useIsMobile } from '@/lib/useIsMobile'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentAccountId = useAppStore((s) => s.currentAccountId)
  const loading = useAppStore((s) => s.loading)
  const isMobile = useIsMobile()
  const persist = useAppStore((s) => s.persist)
  const hydrate = useAppStore((s) => s.hydrate)
  const refresh = useAppStore((s) => s.refresh)

  // Load data from the database once, on first mount.
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Light polling: pull others' changes (new messages, reports…) every 15s.
  useEffect(() => {
    if (!persist || !currentAccountId) return
    const t = setInterval(() => { refresh() }, 15_000)
    return () => clearInterval(t)
  }, [persist, currentAccountId, refresh])

  if (loading) {
    return (
      <div style={{
        height: '100vh', width: '100vw',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F8FAFC', color: '#64748B', fontSize: 16, fontWeight: 600,
        fontFamily: 'var(--font-main, sans-serif)',
      }}>
        <i className="ti ti-loader-2" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />
        Chargement…
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    )
  }

  if (!currentAccountId) {
    return <Login />
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#fff',
    }}>
      {!isMobile && <Sidebar />}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Topbar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px' : '32px',
          paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : undefined,
          background: '#F8FAFC',
        }}>
          {children}
        </main>
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
