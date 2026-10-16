import { Button } from './Button'
import { ProgressBar } from './ProgressBar'
import { StatusBadge, type BadgeTone } from './StatusBadge'

export type PaymentStatus = 'pago' | 'pendente'

const statusInfo: Record<PaymentStatus, { tone: BadgeTone; label: string }> = {
  pago: { tone: 'success', label: 'Pago' },
  pendente: { tone: 'danger', label: 'Pendente' },
}

export interface Payment {
  name: string
  status: PaymentStatus
  paid: string
  total: string
  percent: number
}

/** Linha de rateio: formando, status, progresso de pagamento. */
export function PaymentRow({
  name,
  status,
  paid,
  total,
  percent,
  onAddPayment,
}: Payment & { onAddPayment?: () => void }) {
  const { tone, label } = statusInfo[status]
  return (
    <div className="border-b border-field-border pb-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-medium text-heading">{name}</span>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>

      <ProgressBar className="mt-3" value={percent} />
      <div className="mt-1 flex justify-between font-display text-[12px] text-muted">
        <span>{paid}</span>
        <span>{total}</span>
      </div>

      <div className="mt-2 w-[64%]">
        <Button
          variant="secondary"
          size="sm"
          font="display"
          onClick={onAddPayment}
        >
          Adicionar Pagamento
        </Button>
      </div>
    </div>
  )
}
