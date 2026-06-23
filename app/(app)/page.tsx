'use client'

import { useAppStore, canManage } from '@/store/useAppStore'
import Accueil from '@/components/pages/Accueil'
import Droits from '@/components/pages/Droits'
import Agenda from '@/components/pages/Agenda'
import ComptesRendus from '@/components/pages/ComptesRendus'
import Representants from '@/components/pages/Representants'
import GestionPersonnel from '@/components/pages/GestionPersonnel'
import Messagerie from '@/components/pages/Messagerie'
import Parametres from '@/components/pages/Parametres'

export default function AppPage() {
  const activePage = useAppStore((s) => s.activePage)
  const role = useAppStore((s) => s.role)

  switch (activePage) {
    case 'accueil':       return <Accueil />
    case 'droits':        return <Droits />
    case 'agenda':        return <Agenda />
    case 'comptes':       return <ComptesRendus />
    case 'representants': return canManage(role) ? <GestionPersonnel /> : <Representants />
    case 'messagerie':    return <Messagerie />
    case 'parametres':    return <Parametres />
    default:              return <Accueil />
  }
}
