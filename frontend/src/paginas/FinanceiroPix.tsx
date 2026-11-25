import { useCallback, useMemo, useState } from 'react'
import notaDinheiro from '../assets/banknote-stat.svg'
import circuloCheck from '../assets/circle-check-big.svg'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import mensagemAlerta from '../assets/message-square-warning.svg'
import engrenagem from '../assets/settings.svg'
import { mensagemDeErro } from '../api/cliente'
import { excluirPixInformado, marcarPixConferido, obterRelatorioPix } from '../api/pix'
import type { RelatorioPix } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaPixInformado } from '../componentes/LinhaPixInformado'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarMoeda } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

type Filtro = 'aguardando' | 'conferidos'

/**
 * Financeiro (Pix): relatório dos Pix que os convidados avisaram pela página pública ("Já fiz o Pix"),
 * no presente em dinheiro e nas cotas. Como o Pix é estático, o sistema não sabe se o dinheiro caiu:
 * o organizador confere no extrato e marca cada aviso como conferido (ou exclui um aviso falso).
 */
export function FinanceiroPix({
  eventoId,
  onVoltar,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  /** Configurações da página (onde fica a chave Pix); undefined para quem não pode alterar o evento. */
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => obterRelatorioPix(eventoId), [eventoId])
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  // Cada alteração devolve o relatório inteiro: ele substitui o carregado
  const [atualizado, setAtualizado] = useState<RelatorioPix | null>(null)
  const relatorio = atualizado ?? dados

  const [filtro, setFiltro] = useState<Filtro | null>('aguardando')
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  const visiveis = useMemo(() => {
    const itens = relatorio?.itens ?? []
    if (filtro === 'aguardando') return itens.filter((p) => !p.conferido)
    if (filtro === 'conferidos') return itens.filter((p) => p.conferido)
    return itens
  }, [relatorio, filtro])

  async function executar(id: number, acao: () => Promise<RelatorioPix>) {
    setErroAcao(null)
    setOcupado(id)
    try {
      setAtualizado(await acao())
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setOcupado(null)
    }
  }

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />
      <TituloDestaque>Financeiro (Pix)</TituloDestaque>
      <p className="mt-2 font-display text-[12px] text-muted lg:text-[13px]">
        Os convidados avisam aqui quando fazem um Pix pela página do evento. O Pix não é confirmado
        automaticamente: confira cada valor no extrato do banco e marque como conferido.
      </p>

      {relatorio && !relatorio.pixConfigurado && (
        <div className="mt-4 flex flex-col gap-3 rounded-[12px] border-[1.5px] border-dashed border-field-border p-4 lg:max-w-xl">
          <p className="text-[13px] text-heading">
            A chave Pix ainda não foi configurada, então a página do evento não mostra o Pix para os convidados.
          </p>
          {onAbrirConfiguracoes && (
            <Botao tamanho="pequeno" variante="secundario" className="sm:max-w-xs" onClick={onAbrirConfiguracoes}>
              Configurar o Pix
            </Botao>
          )}
        </div>
      )}

      {/* Totais: carrossel no mobile, grade no desktop */}
      {relatorio && (
        <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
          <CartaoEstatistica icone={notaDinheiro} valor={formatarMoeda(relatorio.totalInformado)} tom="lilas" rotulo="Total avisado" />
          <CartaoEstatistica icone={circuloCheck} valor={formatarMoeda(relatorio.totalConferido)} tom="menta" rotulo="Conferido no extrato" />
          <CartaoEstatistica
            icone={mensagemAlerta}
            valor={String(relatorio.aguardandoConferencia)}
            tom="pessego"
            rotulo="Aguardando conferência"
          />
        </div>
      )}

      {/* Filtros */}
      <div className="mt-5 flex gap-2">
        <ChipFiltro
          rotulo="Aguardando"
          ativo={filtro === 'aguardando'}
          onClick={() => setFiltro((atual) => (atual === 'aguardando' ? null : 'aguardando'))}
        />
        <ChipFiltro
          rotulo="Conferidos"
          ativo={filtro === 'conferidos'}
          onClick={() => setFiltro((atual) => (atual === 'conferidos' ? null : 'conferidos'))}
        />
      </div>

      <AvisoErro className="mt-4" mensagem={erro ?? erroAcao} onTentarNovamente={erro ? recarregar : undefined} />

      {carregando && !relatorio ? (
        <MensagemLista>Carregando...</MensagemLista>
      ) : visiveis.length > 0 ? (
        <ul className="mt-4 mb-24 flex flex-col gap-3 lg:mb-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {visiveis.map((p) => (
            <LinhaPixInformado
              key={p.id}
              pix={p}
              ocupado={ocupado === p.id}
              onAlternarConferido={() => void executar(p.id, () => marcarPixConferido(eventoId, p.id, !p.conferido))}
              onExcluir={() => void executar(p.id, () => excluirPixInformado(eventoId, p.id))}
            />
          ))}
        </ul>
      ) : (
        relatorio && (
          <MensagemLista>
            {filtro === 'aguardando'
              ? 'Nenhum Pix esperando conferência.'
              : filtro === 'conferidos'
                ? 'Nenhum Pix conferido ainda.'
                : 'Nenhum convidado avisou um Pix ainda.'}
          </MensagemLista>
        )
      )}
    </LayoutPainel>
  )
}
