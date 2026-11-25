import { useCallback, useState } from 'react'
import circuloMais from '../assets/circle-plus.svg'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { mensagemDeErro } from '../api/cliente'
import {
  adicionarItemComoPresente,
  atualizarItemChecklist,
  criarItemChecklist,
  excluirItemChecklist,
  obterChecklist,
} from '../api/checklist'
import { listarFormandos } from '../api/formatura'
import type { AcaoDica, CategoriaChecklist, Checklist as DadosChecklist, DadosItemChecklist, ItemChecklist } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { BarraProgresso } from '../componentes/BarraProgresso'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { DicasChecklist } from '../componentes/DicasChecklist'
import { FormularioItemChecklist } from '../componentes/FormularioItemChecklist'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaChecklist } from '../componentes/LinhaChecklist'
import { MensagemLista } from '../componentes/MensagemLista'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { rotulosCategoriaChecklist } from '../dados/formatacao'
import { useAgora } from '../hooks/useAgora'
import { useCarregamento } from '../hooks/useCarregamento'

const categorias = Object.keys(rotulosCategoriaChecklist) as CategoriaChecklist[]

type Filtro = 'pendentes' | 'concluidos'

/** Janela aberta: um item em edição ou um item novo. */
type Janela = ItemChecklist | 'novo' | null

/**
 * Tela da Checklist do evento. Ela começa vazia: o organizador adiciona os itens à mão ou gera um
 * roteiro com IA (os momentos e as brincadeiras escolhidos viram itens). Em cima ficam as dicas calculadas
 * a partir do estado do evento. Quem gerencia o evento edita tudo; na formatura, o responsável por um
 * item pode marcá-lo como feito.
 */
export function Checklist({
  eventoId,
  podeEscolherResponsavel,
  acoes,
  onVoltar,
  onAbrirRoteiro,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  /** Formatura e quem gerencia a comissão: carrega os formandos para escolher o responsável. */
  podeEscolherResponsavel: boolean
  /** Telas que resolvem cada dica (as que o usuário pode abrir). */
  acoes: Partial<Record<AcaoDica, () => void>>
  onVoltar: () => void
  /** Roteiro com IA (só para quem gerencia o evento). */
  onAbrirRoteiro?: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(
    () => Promise.all([obterChecklist(eventoId), podeEscolherResponsavel ? listarFormandos(eventoId) : Promise.resolve(null)]),
    [eventoId, podeEscolherResponsavel],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  // Cada alteração devolve a checklist inteira: ela substitui a carregada
  const [atualizada, setAtualizada] = useState<DadosChecklist | null>(null)
  const checklist = atualizada ?? dados?.[0] ?? null
  const formandos = dados?.[1] ?? undefined
  const agora = useAgora(60_000)

  const [filtro, setFiltro] = useState<Filtro | null>('pendentes')
  const [janela, setJanela] = useState<Janela>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const fecharJanela = useCallback(() => setJanela(null), [])

  const alternarFiltro = (f: Filtro) => setFiltro((atual) => (atual === f ? null : f))

  /** Executa uma alteração de um item e mostra o erro no topo, se houver. */
  async function alterar(id: number, acao: () => Promise<DadosChecklist>, mensagem?: string) {
    setErroAcao(null)
    setAviso(null)
    setOcupado(id)
    try {
      setAtualizada(await acao())
      if (mensagem) setAviso(mensagem)
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setOcupado(null)
    }
  }

  async function salvar(dadosItem: DadosItemChecklist) {
    if (janela === 'novo') setAtualizada(await criarItemChecklist(eventoId, dadosItem))
    else if (janela) setAtualizada(await atualizarItemChecklist(eventoId, janela.id, dadosItem))
    setJanela(null)
  }

  async function excluir() {
    if (janela && janela !== 'novo') setAtualizada(await excluirItemChecklist(eventoId, janela.id))
    setJanela(null)
  }

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  const itens = checklist?.itens ?? []
  const concluidos = itens.filter((i) => i.concluido).length
  const percentual = itens.length > 0 ? Math.floor((concluidos / itens.length) * 100) : 0
  const visiveis = itens.filter((i) => (filtro === 'pendentes' ? !i.concluido : filtro === 'concluidos' ? i.concluido : true))

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />

      <TituloDestaque>Checklist</TituloDestaque>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />
      {carregando && !checklist && <MensagemLista>Carregando checklist...</MensagemLista>}

      {checklist && (
        <>
          {/* Progresso */}
          <div className="mt-5 flex flex-col gap-2 lg:max-w-3xl">
            <div className="flex items-baseline justify-between font-display text-[13px]">
              <span className="font-semibold text-heading">
                {concluidos} de {itens.length} {itens.length === 1 ? 'item concluído' : 'itens concluídos'}
              </span>
              <span className="text-muted">{percentual}%</span>
            </div>
            <BarraProgresso valor={percentual} />
          </div>

          <div className="mt-5">
            <DicasChecklist dicas={checklist.dicas} acoes={acoes} />
          </div>

          {checklist.podeGerenciar && (
            <div className="mt-5 flex flex-col gap-3 lg:max-w-xl lg:flex-row">
              <Botao onClick={() => setJanela('novo')} icone={<img src={circuloMais} alt="" width={24} height={24} />}>
                Adicionar item
              </Botao>
              {onAbrirRoteiro && (
                <Botao variante="secundario" onClick={onAbrirRoteiro}>
                  Gerar roteiro com IA
                </Botao>
              )}
            </div>
          )}

          {/* Filtros */}
          <div className="mt-4 flex gap-2">
            <ChipFiltro rotulo="Pendentes" ativo={filtro === 'pendentes'} onClick={() => alternarFiltro('pendentes')} />
            <ChipFiltro rotulo="Concluídos" ativo={filtro === 'concluidos'} onClick={() => alternarFiltro('concluidos')} />
          </div>

          <AvisoErro className="mt-4" mensagem={erroAcao} />
          {aviso && (
            <p role="status" className="mt-4 rounded-[10px] bg-stat-mint px-4 py-3 text-[13px] text-success lg:max-w-3xl">
              {aviso}
            </p>
          )}

          {/* Itens por categoria */}
          <div className="mt-4 mb-24 flex flex-col gap-6 lg:mb-0 lg:max-w-3xl">
            {visiveis.length === 0 && (
              <MensagemLista>
                {itens.length === 0
                  ? checklist.podeGerenciar
                    ? 'A checklist está vazia. Adicione os itens do seu evento ou gere um roteiro com IA.'
                    : 'A checklist ainda está vazia.'
                  : filtro === 'pendentes'
                    ? 'Nenhum item pendente. Tudo feito!'
                    : 'Nenhum item encontrado.'}
              </MensagemLista>
            )}
            {categorias.map((categoria) => {
              const daCategoria = visiveis.filter((i) => i.categoria === categoria)
              if (daCategoria.length === 0) return null
              return (
                <section key={categoria} className="flex flex-col gap-3">
                  <RotuloSecao>{rotulosCategoriaChecklist[categoria].toUpperCase()}</RotuloSecao>
                  {daCategoria.map((item) => (
                    <LinhaChecklist
                      key={item.id}
                      item={item}
                      agora={agora}
                      ocupado={ocupado === item.id}
                      onAlternar={
                        item.podeConcluir
                          ? () => void alterar(item.id, () => atualizarItemChecklist(eventoId, item.id, { concluido: !item.concluido }))
                          : undefined
                      }
                      onEditar={checklist.podeGerenciar ? () => setJanela(item) : undefined}
                      onVirarPresente={
                        item.podeVirarPresente
                          ? () =>
                              void alterar(
                                item.id,
                                () => adicionarItemComoPresente(eventoId, item.id),
                                `"${item.titulo}" foi adicionado à lista de presentes.`,
                              )
                          : undefined
                      }
                    />
                  ))}
                </section>
              )
            })}
          </div>
        </>
      )}

      <JanelaModal
        titulo={janela === 'novo' ? 'Adicionar item' : 'Editar item'}
        aberta={janela !== null}
        onFechar={fecharJanela}
      >
        {janela !== null && (
          <FormularioItemChecklist
            // key recria o formulário com os dados certos ao trocar de item
            key={janela === 'novo' ? 'novo' : janela.id}
            item={janela === 'novo' ? undefined : janela}
            formandos={formandos}
            onSalvar={salvar}
            onExcluir={janela === 'novo' ? undefined : excluir}
          />
        )}
      </JanelaModal>
    </LayoutPainel>
  )
}
