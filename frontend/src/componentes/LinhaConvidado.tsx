import olhoVer from '../assets/eye-view.svg'
import lapis from '../assets/pencil.svg'
import type { StatusPresenca } from '../api/tipos'
import { SeloStatus, type TomSelo } from './SeloStatus'

const infoStatus: Record<StatusPresenca, { tom: TomSelo; rotulo: string }> = {
  Pendente: { tom: 'neutro', rotulo: 'Pendente' },
  Confirmado: { tom: 'sucesso', rotulo: 'Confirmado' },
  Recusado: { tom: 'perigo', rotulo: 'Recusado' },
}

interface LinhaConvidadoProps {
  nome: string
  status: StatusPresenca
  acompanhantes: number
  observacao?: string | null
  onEditar?: () => void
}

function textoAcompanhantes(quantidade: number) {
  if (quantidade === 0) return 'Nenhum acompanhante'
  return `+ ${quantidade} ${quantidade === 1 ? 'Acompanhante' : 'Acompanhantes'}`
}

/** Linha de convidado na lista de gestão. */
export function LinhaConvidado({ nome, status, acompanhantes, observacao, onEditar }: LinhaConvidadoProps) {
  const { tom, rotulo } = infoStatus[status]
  return (
    <div className="border-b border-field-border pb-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-medium text-heading">{nome}</span>
        <SeloStatus tom={tom}>{rotulo}</SeloStatus>
      </div>
      <p className="mt-1 font-display text-[12px] text-muted">{textoAcompanhantes(acompanhantes)}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-display text-[12px] text-muted">Obs:</span>
        {observacao ? (
          <button
            type="button"
            title={observacao}
            aria-label="Ver observação"
            className="flex size-[22px] items-center justify-center rounded-[2px] bg-primary"
          >
            <img src={olhoVer} alt="" width={14} height={14} />
          </button>
        ) : (
          <span className="font-display text-[12px] text-muted">sem obs</span>
        )}
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar ${nome}`}
          className="ml-auto flex size-6 items-center justify-center rounded-[2px] bg-primary"
        >
          <img src={lapis} alt="" width={14} height={16} />
        </button>
      </div>
    </div>
  )
}
