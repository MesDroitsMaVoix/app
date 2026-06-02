'use client'

import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
          background: '#fafaf9',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}