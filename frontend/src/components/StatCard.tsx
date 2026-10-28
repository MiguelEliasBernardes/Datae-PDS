import type { ReactNode } from 'react'

const tones = {
  lilac: 'bg-badge',
  mint: 'bg-stat-mint',
  peach: 'bg-stat-peach',
  rose: 'bg-danger-bg',
} as const

export interface StatCardProps {
  icon: string
  value: string
  label: ReactNode
  tone?: keyof typeof tones
}

/** Card de estatística do carrossel do painel do evento. */
export function StatCard({ icon, value, label, tone = 'lilac' }: StatCardProps) {
  return (
    <div
      className={`flex h-[84px] w-[300px] shrink-0 items-center gap-3 rounded-[12px] px-4 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)] lg:w-auto lg:shrink ${tones[tone]}`}
    >
      <img src={icon} alt="" width={48} height={48} className="shrink-0" />
      <div className="flex flex-col">
        <span className="font-display text-[14px] font-semibold text-muted">
          {label}
        </span>
        <span className="font-heading text-[18px] font-bold text-heading">
          {value}
        </span>
      </div>
    </div>
  )
}
