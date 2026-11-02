import type { ReactNode } from 'react'

const fontes = {
  display: 'font-display',
  heading: 'font-heading',
} as const

/** Título de página com a barra de acento laranja à esquerda. */
export function TituloDestaque({
  children,
  fonte = 'display',
}: {
  children: ReactNode
  fonte?: keyof typeof fontes
}) {
  return (
    <header className="flex items-center gap-2.5">
      <span className="h-[30px] w-[3px] shrink-0 rounded-full bg-accent" />
      <h1 className={`${fontes[fonte]} text-[20px] font-bold text-heading`}>
        {children}
      </h1>
    </header>
  )
}
