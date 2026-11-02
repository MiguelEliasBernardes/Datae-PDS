import type { ReactNode } from 'react'

/** Texto centralizado das listas: "Carregando...", "Nenhum convidado encontrado.", etc. */
export function MensagemLista({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 text-center font-display text-[13px] text-muted lg:col-span-2">
      {children}
    </p>
  )
}
