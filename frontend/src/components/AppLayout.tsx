import type { ReactNode } from 'react'
import { BottomNav, type BottomNavItem } from './BottomNav'
import { Sidebar } from './Sidebar'

/**
 * Casca das telas "dentro de um evento": sidebar no desktop, barra
 * inferior flutuante no mobile. O conteúdo ocupa a largura toda em telas
 * grandes (até max-w-6xl) e se mantém em coluna única no mobile.
 */
export function AppLayout({
  items,
  children,
}: {
  items: BottomNavItem[]
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-surface">
      <Sidebar items={items} />
      <div className="mx-auto flex min-h-screen w-full max-w-[402px] flex-1 flex-col px-6 pt-10 lg:max-w-6xl lg:px-12 lg:pt-12 lg:pb-12">
        {children}
        <BottomNav items={items} className="lg:hidden" />
      </div>
    </div>
  )
}
