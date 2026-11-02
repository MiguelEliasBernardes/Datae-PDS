import type { ReactNode } from 'react'

export type TomSelo = 'sucesso' | 'perigo' | 'neutro' | 'destaque' | 'admin'

const tons: Record<TomSelo, string> = {
  sucesso: 'bg-stat-mint text-success',
  perigo: 'bg-danger-bg text-danger',
  neutro: 'bg-field-border text-muted',
  destaque: 'bg-stat-peach text-accent',
  admin: 'bg-admin-bg text-admin',
}

/** Selo de status reutilizável (Confirmado/Recusado, Disponível/Reservado…). */
export function SeloStatus({
  tom,
  children,
}: {
  tom: TomSelo
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center justify-center rounded-[12px] px-3 text-[11px] font-medium ${tons[tom]}`}
    >
      {children}
    </span>
  )
}
