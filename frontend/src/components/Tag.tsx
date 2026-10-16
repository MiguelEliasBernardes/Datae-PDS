import type { ReactNode } from 'react'

/** Pílula de categoria (ex.: "Chá de panela", "Formatura"). */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[9px] bg-badge px-2.5 py-1 text-[11px] font-medium text-heading">
      {children}
    </span>
  )
}
