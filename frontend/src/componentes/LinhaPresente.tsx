import lapis from '../assets/pencil.svg'
import type { StatusPresente } from '../api/tipos'
import { SeloStatus, type TomSelo } from './SeloStatus'

const infoStatus: Record<StatusPresente, { tom: TomSelo; rotulo: string }> = {
  Disponivel: { tom: 'sucesso', rotulo: 'Disponível' },
  Reservado: { tom: 'perigo', rotulo: 'Reservado' },
  Comprado: { tom: 'destaque', rotulo: 'Comprado' },
}

interface LinhaPresenteProps {
  imagem: string
  nome: string
  preco: string
  status: StatusPresente
  /** Nome de quem reservou/comprou, quando houver. */
  reservadoPor?: string | null
  onEditar?: () => void
}

/** Linha de produto da lista de presentes. */
export function LinhaPresente({ imagem, nome, preco, status, reservadoPor, onEditar }: LinhaPresenteProps) {
  const { tom, rotulo } = infoStatus[status]
  return (
    <div className="flex gap-3 border-b border-field-border pb-3">
      <img
        src={imagem}
        alt=""
        className="size-[71px] shrink-0 rounded-[5px] object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[14px] font-medium text-heading">
            {nome}
          </span>
          <SeloStatus tom={tom}>{rotulo}</SeloStatus>
        </div>
        <p className="mt-0.5 font-display text-[12px] text-muted">{preco}</p>
        {reservadoPor && (
          <p className="truncate font-display text-[12px] text-muted">
            {status === 'Comprado' ? 'Comprado por' : 'Reservado por'} {reservadoPor}
          </p>
        )}
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar ${nome}`}
          className="mt-2 flex size-6 items-center justify-center rounded-[2px] bg-primary"
        >
          <img src={lapis} alt="" width={14} height={16} />
        </button>
      </div>
    </div>
  )
}
