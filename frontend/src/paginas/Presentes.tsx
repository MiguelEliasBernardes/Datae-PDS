import { useCallback, useMemo, useState } from 'react'
import circuloCheck from '../assets/circle-check-big.svg'
import circuloMais from '../assets/circle-plus.svg'
import olho from '../assets/eye.svg'
import presenteIcone from '../assets/gift-stat.svg'
import casaBranca from '../assets/house-white.svg'
import imagemPadrao from '../assets/product-sample.png'
import engrenagem from '../assets/settings.svg'
import sacola from '../assets/shopping-bag.svg'
import { listarConvidados } from '../api/convidados'
import { atualizarPresente, criarPresente, excluirPresente, listarPresentes } from '../api/presentes'
import type { DadosPresente, Presente } from '../api/tipos'
import { AssistentePresentes } from '../componentes/AssistentePresentes'
import { AvisoErro } from '../componentes/AvisoErro'
import { CartaoMinhaPagina } from '../componentes/CartaoMinhaPagina'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CarrosselEstatisticas } from '../componentes/CarrosselEstatisticas'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { FormularioPresente } from '../componentes/FormularioPresente'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaPresente } from '../componentes/LinhaPresente'
import { ListaCotas } from '../componentes/ListaCotas'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarMoeda } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

type Filtro = 'disponiveis' | 'reservados' | 'comprados' | 'cotas'

/** Presente em edição: null = janela fechada, 'novo' = adicionando. */
type Edicao = Presente | 'novo' | null

/**
 * Tela O6 - Gestão da Lista de Presentes. Com `minhaLista`, é a lista pessoal do formando
 * logado (sub-página dele na formatura) em vez da lista do evento.
 */
export function Presentes({
  eventoId,
  minhaLista = false,
  onVoltar,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  minhaLista?: boolean
  onVoltar: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  // Os convidados vêm junto só para mostrar o nome de quem reservou cada presente
  // (na lista pessoal o formando não acessa os convidados do evento, então os nomes não aparecem)
  const carregar = useCallback(
    () => Promise.all([listarPresentes(eventoId, minhaLista), minhaLista ? Promise.resolve([]) : listarConvidados(eventoId)]),
    [eventoId, minhaLista],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const presentes = dados?.[0] ?? null
  const nomesConvidados = useMemo(() => new Map((dados?.[1] ?? []).map((c) => [c.id, c.nome])), [dados])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro | null>(null)
  const [edicao, setEdicao] = useState<Edicao>(null)
  const [assistenteAberto, setAssistenteAberto] = useState(false)

  const alternarFiltro = (f: Filtro) => setFiltro((atual) => (atual === f ? null : f))
  const fecharJanela = useCallback(() => setEdicao(null), [])
  const fecharAssistente = useCallback(() => setAssistenteAberto(false), [])

  const visiveis = useMemo(() => {
    return (presentes ?? []).filter((p) => {
      if (!p.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtro === 'disponiveis') return p.status === 'Disponivel'
      if (filtro === 'reservados') return p.status === 'Reservado'
      if (filtro === 'comprados') return p.status === 'Comprado'
      if (filtro === 'cotas') return p.quantidadeCotas !== null
      return true
    })
  }, [presentes, busca, filtro])

  const lista = presentes ?? []
  const disponiveis = lista.filter((p) => p.status === 'Disponivel').length
  const reservados = lista.filter((p) => p.status === 'Reservado').length
  const comprados = lista.filter((p) => p.status === 'Comprado').length

  async function salvar(dados: DadosPresente) {
    if (edicao === 'novo') await criarPresente(eventoId, dados, minhaLista)
    else if (edicao) await atualizarPresente(eventoId, edicao.id, dados, minhaLista)
    setEdicao(null)
    recarregar()
  }

  async function excluir() {
    if (edicao && edicao !== 'novo') await excluirPresente(eventoId, edicao.id, minhaLista)
    setEdicao(null)
    recarregar()
  }

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />

      <TituloDestaque>{minhaLista ? 'Meus presentes' : 'Lista de Presentes'}</TituloDestaque>

      {minhaLista && (
        <div className="mt-5">
          <CartaoMinhaPagina eventoId={eventoId} />
        </div>
      )}

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <CarrosselEstatisticas className="mt-5">
        <CartaoEstatistica icone={presenteIcone} valor={String(lista.length)} tom="lilas" rotulo="Presentes" />
        <CartaoEstatistica
          icone={sacola}
          valor={String(reservados + comprados)}
          tom="rosa"
          rotulo={
            <>
              Reservados{' '}
              <span className="text-[9px] font-normal">({comprados} já {comprados === 1 ? 'comprado' : 'comprados'})</span>
            </>
          }
        />
        <CartaoEstatistica icone={circuloCheck} valor={String(disponiveis)} tom="pessego" rotulo="Disponíveis" />
      </CarrosselEstatisticas>

      {/* Adicionar presente (à mão ou com as sugestões do assistente de IA) */}
      <div className="mt-5 flex flex-col gap-2 lg:flex-row lg:gap-3">
        <Botao
          className="lg:max-w-xs"
          onClick={() => setEdicao('novo')}
          icone={<img src={circuloMais} alt="" width={24} height={24} />}
        >
          Adicionar Presente
        </Botao>
        <Botao className="lg:max-w-xs" variante="secundario" onClick={() => setAssistenteAberto(true)}>
          Sugerir com IA
        </Botao>
      </div>

      {/* Busca */}
      <CampoTexto
        className="mt-4 lg:max-w-md"
        name="busca-presente"
        placeholder="Presente..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <ChipFiltro rotulo="Disponíveis" ativo={filtro === 'disponiveis'} onClick={() => alternarFiltro('disponiveis')} />
        <ChipFiltro rotulo="Reservados" ativo={filtro === 'reservados'} onClick={() => alternarFiltro('reservados')} />
        <ChipFiltro rotulo="Comprados" ativo={filtro === 'comprados'} onClick={() => alternarFiltro('comprados')} />
        <ChipFiltro rotulo="Cotas" ativo={filtro === 'cotas'} onClick={() => alternarFiltro('cotas')} />
      </div>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Lista de presentes */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {carregando && !presentes ? (
          <MensagemLista>Carregando presentes...</MensagemLista>
        ) : visiveis.length > 0 ? (
          visiveis.map((p) => (
            <LinhaPresente
              key={p.id}
              imagem={p.foto || imagemPadrao}
              nome={p.nome}
              preco={formatarMoeda(p.valorEstimado)}
              status={p.status}
              reservadoPor={p.convidadoId ? nomesConvidados.get(p.convidadoId) : null}
              cotas={
                p.quantidadeCotas !== null
                  ? `${p.cotasVendidas}/${p.quantidadeCotas} cotas · ${formatarMoeda(p.valorCota)} cada`
                  : null
              }
              onEditar={() => setEdicao(p)}
            />
          ))
        ) : (
          presentes && <MensagemLista>Nenhum presente encontrado.</MensagemLista>
        )}
      </div>

      <JanelaModal
        titulo={edicao === 'novo' ? 'Adicionar presente' : 'Editar presente'}
        aberta={edicao !== null}
        onFechar={fecharJanela}
      >
        {edicao !== null && (
          <FormularioPresente
            // key recria o formulário com os dados certos ao trocar de presente
            key={edicao === 'novo' ? 'novo' : edicao.id}
            presente={edicao === 'novo' ? undefined : edicao}
            onSalvar={salvar}
            onExcluir={edicao === 'novo' ? undefined : excluir}
          />
        )}
        {edicao !== null && edicao !== 'novo' && edicao.quantidadeCotas !== null && (
          <ListaCotas eventoId={eventoId} presenteId={edicao.id} minhaLista={minhaLista} onAlterado={recarregar} />
        )}
      </JanelaModal>

      <JanelaModal titulo="Sugestões com IA" aberta={assistenteAberto} onFechar={fecharAssistente}>
        {assistenteAberto && (
          <AssistentePresentes
            eventoId={eventoId}
            minhaLista={minhaLista}
            onAdicionados={() => {
              setAssistenteAberto(false)
              recarregar()
            }}
          />
        )}
      </JanelaModal>
    </LayoutPainel>
  )
}
