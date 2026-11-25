import lapis from '../assets/pencil.svg'
import type { ItemChecklist } from '../api/tipos'
import { descreverPrazo } from '../dados/formatacao'

/**
 * Item da checklist: marcador de feito, título, descrição, prazo (em vermelho se venceu)
 * e responsável. Os botões só aparecem para quem pode usá-los.
 */
export function LinhaChecklist({
  item,
  agora,
  ocupado = false,
  onAlternar,
  onEditar,
  onVirarPresente,
}: {
  item: ItemChecklist
  agora: number
  /** Enquanto a alteração deste item é salva. */
  ocupado?: boolean
  onAlternar?: () => void
  onEditar?: () => void
  onVirarPresente?: () => void
}) {
  const prazo = item.prazo ? descreverPrazo(item.prazo, agora) : null
  const atrasado = prazo?.vencido && !item.concluido

  return (
    <div className={`flex gap-3 border-b border-field-border pb-3 ${ocupado ? 'opacity-60' : ''}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.concluido}
        aria-label={item.concluido ? `Desmarcar "${item.titulo}"` : `Marcar "${item.titulo}" como feito`}
        disabled={!onAlternar || ocupado}
        onClick={onAlternar}
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-default ${
          item.concluido ? 'border-success bg-success text-surface' : 'border-field-border bg-surface hover:border-primary'
        }`}
      >
        {item.concluido && (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-[14px] font-medium ${item.concluido ? 'text-muted line-through' : 'text-heading'}`}>
          {item.titulo}
        </p>
        {item.descricao && <p className="mt-0.5 font-display text-[12px] text-muted">{item.descricao}</p>}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-display text-[11px]">
          {prazo && <span className={atrasado ? 'font-semibold text-danger' : 'text-muted'}>{prazo.texto}</span>}
          {item.responsavelNome && <span className="text-muted">Responsável: {item.responsavelNome}</span>}
        </div>

        {(onEditar || onVirarPresente) && (
          <div className="mt-2 flex items-center gap-3">
            {onEditar && (
              <button
                type="button"
                onClick={onEditar}
                aria-label={`Editar "${item.titulo}"`}
                className="flex size-6 items-center justify-center rounded-[2px] bg-primary"
              >
                <img src={lapis} alt="" width={14} height={16} />
              </button>
            )}
            {onVirarPresente && (
              <button
                type="button"
                disabled={ocupado}
                onClick={onVirarPresente}
                className="text-[12px] font-medium text-primary underline disabled:opacity-60"
              >
                Adicionar à lista de presentes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
