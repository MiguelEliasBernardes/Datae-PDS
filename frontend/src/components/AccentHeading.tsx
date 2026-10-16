import type { ReactNode } from 'react'

const fonts = {
  display: 'font-display',
  heading: 'font-heading',
} as const

/** Título de página com a barra de acento laranja à esquerda. */
export function AccentHeading({
  children,
  font = 'display',
}: {
  children: ReactNode
  font?: keyof typeof fonts
}) {
  return (
    <header className="flex items-center gap-2.5">
      <span className="h-[30px] w-[3px] shrink-0 rounded-full bg-accent" />
      <h1 className={`${fonts[font]} text-[20px] font-bold text-heading`}>
        {children}
      </h1>
    </header>
  )
}
