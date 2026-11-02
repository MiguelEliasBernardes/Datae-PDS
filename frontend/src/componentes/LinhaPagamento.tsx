import { BarraProgresso } from './BarraProgresso'
import { Botao } from './Botao'
import { SeloStatus, type TomSelo } from './SeloStatus'

export type StatusPagamento = 'pago' | 'pendente'

const infoStatus: Record<StatusPagamento, { tom: TomSelo; rotulo: string }> = {
  pago: { tom: 'sucesso', rotulo: 'Pago' },
  pendente: { tom: 'perigo', rotulo: 'Pendente' },
}

export interface Pagamento {
  nome: string
  status: StatusPagamento
  pago: string
  total: string
  percentual: number
}

/** Linha de rateio: formando, status, progresso de pagamento. */
export function LinhaPagamento({
  nome,
  status,
  pago,
  total,
  percentual,
  onAdicionarPagamento,
}: Pagamento & { onAdicionarPagamento?: () => void }) {
  const { tom, rotulo } = infoStatus[status]
  return (
    <div className="border-b border-field-border pb-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-medium text-heading">{nome}</span>
        <SeloStatus tom={tom}>{rotulo}</SeloStatus>
      </div>

      <BarraProgresso className="mt-3" valor={percentual} />
      <div className="mt-1 flex justify-between font-display text-[12px] text-muted">
        <span>{pago}</span>
        <span>{total}</span>
      </div>

      <div className="mt-2 w-[64%]">
        <Botao
          variante="secundario"
          tamanho="pequeno"
          fonte="display"
          onClick={onAdicionarPagamento}
        >
          Adicionar Pagamento
        </Botao>
      </div>
    </div>
  )
}
