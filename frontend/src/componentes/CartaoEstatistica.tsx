import type { ReactNode } from 'react'

const tons = {
  lilas: 'bg-badge',
  menta: 'bg-stat-mint',
  pessego: 'bg-stat-peach',
  rosa: 'bg-danger-bg',
} as const

export interface CartaoEstatisticaProps {
  icone: string
  valor: string
  rotulo: ReactNode
  tom?: keyof typeof tons
}

/** Card de estatística do carrossel do painel do evento. */
export function CartaoEstatistica({ icone, valor, rotulo, tom = 'lilas' }: CartaoEstatisticaProps) {
  return (
    <div
      className={`flex h-[84px] w-[300px] shrink-0 items-center gap-3 rounded-[12px] px-4 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)] lg:w-auto lg:shrink ${tons[tom]}`}
    >
      <img src={icone} alt="" width={48} height={48} className="shrink-0" />
      <div className="flex flex-col">
        <span className="font-display text-[14px] font-semibold text-muted">
          {rotulo}
        </span>
        <span className="font-heading text-[18px] font-bold text-heading">
          {valor}
        </span>
      </div>
    </div>
  )
}
