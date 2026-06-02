import { create } from 'zustand'

export type Role = 'travailleur' | 'accompagnateur'
export type PageId = 'droits' | 'agenda' | 'messagerie' | 'organisation'

interface AppState {
  role: Role
  activePage: PageId
  sidebarExpanded: boolean
  notifOpen: boolean
  toggleRole: () => void
  setPage: (page: PageId) => void
  toggleSidebar: () => void
  toggleNotif: () => void
  closeNotif: () => void
}

export const useAppStore = create<AppState>((set) => ({
  role: 'travailleur',
  activePage: 'droits',
  sidebarExpanded: false,
  notifOpen: false,

  toggleRole: () =>
    set((s) => ({ role: s.role === 'travailleur' ? 'accompagnateur' : 'travailleur' })),

  setPage: (page) => set({ activePage: page, notifOpen: false }),

  toggleSidebar: () =>
    set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),

  toggleNotif: () =>
    set((s) => ({ notifOpen: !s.notifOpen })),

  closeNotif: () => set({ notifOpen: false }),
}))