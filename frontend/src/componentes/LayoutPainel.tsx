import type { ReactNode } from 'react'
import { BarraLateral } from './BarraLateral'
import { NavegacaoInferior, type ItemNavegacao } from './NavegacaoInferior'

/**
 * Casca das telas "dentro de um evento": barra lateral no desktop, barra
 * inferior flutuante no mobile. O conteúdo ocupa a largura toda em telas
 * grandes (até max-w-6xl) e se mantém em coluna única no mobile.
 */
export function LayoutPainel({
  itens,
  children,
}: {
  itens: ItemNavegacao[]
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-surface">
      <BarraLateral itens={itens} />
      <div className="mx-auto flex min-h-screen w-full max-w-[402px] flex-1 flex-col px-6 pt-10 lg:max-w-6xl lg:px-12 lg:pt-12 lg:pb-12">
        {children}
        <NavegacaoInferior itens={itens} className="lg:hidden" />
      </div>
    </div>
  )
}
