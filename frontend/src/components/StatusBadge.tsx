import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'danger' | 'neutral' | 'accent' | 'admin'

const tones: Record<BadgeTone, string> = {
  success: 'bg-stat-mint text-success',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-field-border text-muted',
  accent: 'bg-stat-peach text-accent',
  admin: 'bg-admin-bg text-admin',
}

/** Selo de status reutilizável (Confirmado/Recusado, Disponível/Indisponível…). */
export function StatusBadge({
  tone,
  children,
}: {
  tone: BadgeTone
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center justify-center rounded-[12px] px-3 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
