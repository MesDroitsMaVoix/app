'use client'

import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import Login from '@/components/Login'
import { useAppStore } from '@/store/useAppStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentAccountId = useAppStore((s) => s.currentAccountId)

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
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Topbar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          background: '#F8FAFC',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}