import { useCallback, useMemo, useState } from 'react'
import livroImagem from '../assets/book-image.svg'
import circuloCheck from '../assets/circle-check-big.svg'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import emailRecusado from '../assets/mail-x.svg'
import engrenagem from '../assets/settings.svg'
import { excluirFoto, listarFotos, moderarFoto } from '../api/mural'
import type { StatusFoto } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { CartaoFotoModeracao } from '../componentes/CartaoFotoModeracao'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { useCarregamento } from '../hooks/useCarregamento'

/** Tela O8 - Moderação do Mural de fotos. */
export function Mural({
  eventoId,
  onVoltar,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirConfiguracoes: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => listarFotos(eventoId), [eventoId])
  const { dados: fotos, erro, carregando, recarregar } = useCarregamento(carregar)

  // Começa mostrando o que precisa de atenção: as pendentes
  const [filtro, setFiltro] = useState<StatusFoto | null>('Pendente')
  const alternarFiltro = (f: StatusFoto) => setFiltro((atual) => (atual === f ? null : f))

  const lista = useMemo(() => fotos ?? [], [fotos])
  const visiveis = useMemo(() => (filtro ? lista.filter((f) => f.status === filtro) : lista), [lista, filtro])
  const contar = (status: StatusFoto) => lista.filter((f) => f.status === status).length

  async function moderar(id: number, status: StatusFoto) {
    await moderarFoto(eventoId, id, status)
    recarregar()
  }

  async function excluir(id: number) {
    await excluirFoto(eventoId, id)
    recarregar()
  }

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  const mensagemVazia: Record<StatusFoto, string> = {
    Pendente: 'Nenhuma foto esperando aprovação.',
    Aprovada: 'Nenhuma foto aprovada ainda.',
    Recusada: 'Nenhuma foto recusada.',
  }

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />

      <TituloDestaque>Mural de fotos</TituloDestaque>
      <p className="mt-2 font-display text-[12px] text-muted lg:text-[13px]">
        Os convidados enviam fotos pela página do evento. Só as aprovadas aparecem no mural.
      </p>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        <CartaoEstatistica icone={livroImagem} valor={String(contar('Pendente'))} tom="pessego" rotulo="Pendentes" />
        <CartaoEstatistica icone={circuloCheck} valor={String(contar('Aprovada'))} tom="menta" rotulo="Aprovadas" />
        <CartaoEstatistica icone={emailRecusado} valor={String(contar('Recusada'))} tom="rosa" rotulo="Recusadas" />
      </div>

      {/* Filtros */}
      <div className="mt-5 flex gap-2">
        <ChipFiltro rotulo="Pendentes" ativo={filtro === 'Pendente'} onClick={() => alternarFiltro('Pendente')} />
        <ChipFiltro rotulo="Aprovadas" ativo={filtro === 'Aprovada'} onClick={() => alternarFiltro('Aprovada')} />
        <ChipFiltro rotulo="Recusadas" ativo={filtro === 'Recusada'} onClick={() => alternarFiltro('Recusada')} />
      </div>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Fotos */}
      {carregando && !fotos ? (
        <MensagemLista>Carregando fotos...</MensagemLista>
      ) : visiveis.length > 0 ? (
        <div className="mt-4 mb-24 grid grid-cols-2 gap-3 lg:mb-0 lg:grid-cols-4 lg:gap-5">
          {visiveis.map((f) => (
            <CartaoFotoModeracao
              key={f.id}
              foto={f}
              onModerar={(status) => moderar(f.id, status)}
              onExcluir={() => excluir(f.id)}
            />
          ))}
        </div>
      ) : (
        fotos && <MensagemLista>{filtro ? mensagemVazia[filtro] : 'Nenhuma foto enviada ainda.'}</MensagemLista>
      )}
    </LayoutPainel>
  )
}
