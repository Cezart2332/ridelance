import type { ReactNode } from 'react'

import { PanelLayout, type PanelNavItem } from '../panel/PanelLayout'

export type AdminNavItem = PanelNavItem

/** Cadrul adminului: panoul comun cu contabilul (bara laterală, breadcrumb, temă). */
export function AdminLayout({ children, navItems, activeId, onNavClick, onLogout, userName }: {
  children: ReactNode
  navItems: AdminNavItem[]
  activeId: string
  onNavClick: (id: string) => void
  onLogout: () => void
  userName: string
}) {
  return (
    <PanelLayout workspace="Admin" navItems={navItems} activeId={activeId} onNavClick={onNavClick} onLogout={onLogout} userName={userName} userRole="Administrator">
      {children}
    </PanelLayout>
  )
}
