import eyeView from '../assets/eye-view.svg'
import { StatusBadge } from './StatusBadge'

export type GuestStatus = 'confirmado' | 'recusado'

const statusInfo = {
  confirmado: { tone: 'success', label: 'Confirmado' },
  recusado: { tone: 'danger', label: 'Recusado' },
} as const

export interface Guest {
  name: string
  status: GuestStatus
  companions: string
  obs?: string
}

/** Linha de convidado na lista de gestão. */
export function GuestRow({ name, status, companions, obs }: Guest) {
  const { tone, label } = statusInfo[status]
  return (
    <div className="border-b border-field-border pb-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-medium text-heading">{name}</span>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
      <p className="mt-1 font-display text-[12px] text-muted">{companions}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-display text-[12px] text-muted">Obs:</span>
        {obs ? (
          <button
            type="button"
            title={obs}
            aria-label="Ver observação"
            className="flex size-[22px] items-center justify-center rounded-[2px] bg-primary"
          >
            <img src={eyeView} alt="" width={14} height={14} />
          </button>
        ) : (
          <span className="font-display text-[12px] text-muted">sem obs</span>
        )}
      </div>
    </div>
  )
}
