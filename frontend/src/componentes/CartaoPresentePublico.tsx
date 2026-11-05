import { SeloStatus, type TomSelo } from './SeloStatus'

export interface CartaoPresentePublicoProps {
  nome: string
  preco: string
  status: { rotulo: string; tom: TomSelo }
  acao?: string
  imagem?: string
  /** Link da loja cadastrado pelo organizador. */
  link?: string
  onAcao?: () => void
}

/** Cartão de presente na página pública do evento. */
export function CartaoPresentePublico({ nome, preco, status, acao, imagem, link, onAcao }: CartaoPresentePublicoProps) {
  return (
    <div className="flex gap-3 rounded-[12px] bg-surface p-3 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.12)]">
      <div
        className="size-20 shrink-0 overflow-hidden rounded-[10px] bg-theme-lilac"
      >
        {imagem && (
          <img src={imagem} alt="" className="size-full object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate text-[14px] font-bold text-heading">{nome}</h3>
        <p className="text-[13px] text-muted">
          {preco}
          {link && (
            <>
              {' · '}
              <a href={link} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                Ver na loja
              </a>
            </>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <SeloStatus tom={status.tom}>{status.rotulo}</SeloStatus>
          {acao && (
            <button
              type="button"
              onClick={onAcao}
              className="h-7 shrink-0 rounded-[10px] bg-primary px-3 text-[14px] font-medium text-surface transition-colors hover:bg-primary/90"
            >
              {acao}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
