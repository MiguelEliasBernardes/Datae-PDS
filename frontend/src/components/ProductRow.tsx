import pencil from '../assets/pencil.svg'
import { StatusBadge } from './StatusBadge'

export type ProductStatus = 'disponivel' | 'indisponivel'

const statusInfo = {
  disponivel: { tone: 'success', label: 'Disponível' },
  indisponivel: { tone: 'danger', label: 'Indisponível' },
} as const

export interface Product {
  image: string
  name: string
  price: string
  status: ProductStatus
}

/** Linha de produto da lista de presentes. */
export function ProductRow({
  image,
  name,
  price,
  status,
  onEdit,
}: Product & { onEdit?: () => void }) {
  const { tone, label } = statusInfo[status]
  return (
    <div className="flex gap-3 border-b border-field-border pb-3">
      <img
        src={image}
        alt=""
        className="size-[71px] shrink-0 rounded-[5px] object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[14px] font-medium text-heading">
            {name}
          </span>
          <StatusBadge tone={tone}>{label}</StatusBadge>
        </div>
        <p className="mt-0.5 font-display text-[12px] text-muted">{price}</p>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar presente"
          className="mt-2 flex size-6 items-center justify-center rounded-[2px] bg-primary"
        >
          <img src={pencil} alt="" width={14} height={16} />
        </button>
      </div>
    </div>
  )
}
