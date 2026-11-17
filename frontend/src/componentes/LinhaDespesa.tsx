import lapis from '../assets/pencil.svg'

/** Linha de despesa da formatura (descrição, valor, data e botão de editar). */
export function LinhaDespesa({
  descricao,
  valor,
  data,
  onEditar,
}: {
  descricao: string
  valor: string
  data?: string | null
  onEditar?: () => void
}) {
  return (
    <div className="border-b border-field-border pb-3">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-[14px] font-medium text-heading">{descricao}</span>
        <span className="shrink-0 font-display text-[14px] font-semibold text-heading">{valor}</span>
      </div>
      {data && <p className="mt-0.5 font-display text-[12px] text-muted">Data: {data}</p>}
      {onEditar && (
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar ${descricao}`}
          className="mt-2 flex h-7 w-8 items-center justify-center rounded-[2px] bg-primary"
        >
          <img src={lapis} alt="" width={14} height={17} />
        </button>
      )}
    </div>
  )
}
