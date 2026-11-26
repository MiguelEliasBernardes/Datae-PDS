import setaTraco from '../assets/arrow-big-right-dash.svg'
import { Botao } from './Botao'
import { Etiqueta } from './Etiqueta'
import { FundoCorEvento } from './FundoCorEvento'

export interface CartaoEventoProps {
  /** Banner do evento; sem ele, mostra um degradê na cor do evento. */
  imagem?: string | null
  cor?: string | null
  titulo: string
  data: string
  categoria: string
  onAcessar?: () => void
}

/** Cartão de evento da lista "Meus Eventos". */
export function CartaoEvento({
  imagem,
  cor,
  titulo,
  data,
  categoria,
  onAcessar,
}: CartaoEventoProps) {
  return (
    // isolate + transform-gpu: o Safari do iPhone às vezes deixa uma faixa em branco no topo do cartão
    // quando a imagem termina de carregar depois (comum em produção, onde ela vem do armazenamento).
    // Com uma camada própria, o cartão é repintado inteiro.
    <article className="isolate flex h-[115px] transform-gpu overflow-hidden rounded-[12px] bg-surface shadow-[0px_2px_6px_0px_rgba(0,0,0,0.25)]">
      {imagem ? (
        <img
          src={imagem}
          alt=""
          width={111}
          height={115}
          decoding="async"
          className="h-full w-[111px] shrink-0 object-cover"
        />
      ) : (
        <FundoCorEvento cor={cor} className="h-full w-[111px] shrink-0" />
      )}

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[14px] font-bold text-heading">
              {titulo}
            </h2>
            <p className="mt-1 font-display text-[12px] text-muted">
              Data: {data}
            </p>
          </div>
          <Etiqueta>{categoria}</Etiqueta>
        </div>

        <Botao
          variante="secundario"
          tamanho="pequeno"
          onClick={onAcessar}
          icone={<img src={setaTraco} alt="" width={17} height={17} />}
          className="mt-auto"
        >
          Acessar
        </Botao>
      </div>
    </article>
  )
}
