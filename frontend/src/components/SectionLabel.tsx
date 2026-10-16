import type { ReactNode } from 'react'

/** Rótulo de seção em maiúsculas com espaçamento (ex.: "O CONVITE", "PRESENÇA"). */
export function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={`text-[10px] font-bold tracking-[1.6px] text-primary ${className}`}
    >
      {children}
    </p>
  )
}
