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
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { FormularioPresente } from '../componentes/FormularioPresente'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaPresente } from '../componentes/LinhaPresente'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarMoeda } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

type Filtro = 'disponiveis' | 'reservados' | 'comprados' | 'cotas'

/** Presente em edição: null = janela fechada, 'novo' = adicionando. */
type Edicao = Presente | 'novo' | null

/** Tela O6 - Gestão da Lista de Presentes. */
export function Presentes({
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
  // Os convidados vêm junto só para mostrar o nome de quem reservou cada presente
  const carregar = useCallback(
    () => Promise.all([listarPresentes(eventoId), listarConvidados(eventoId)]),
    [eventoId],
  )
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const presentes = dados?.[0] ?? null
  const nomesConvidados = useMemo(() => new Map((dados?.[1] ?? []).map((c) => [c.id, c.nome])), [dados])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro | null>(null)
  const [edicao, setEdicao] = useState<Edicao>(null)

  const alternarFiltro = (f: Filtro) => setFiltro((atual) => (atual === f ? null : f))
  const fecharJanela = useCallback(() => setEdicao(null), [])

  const visiveis = useMemo(() => {
    return (presentes ?? []).filter((p) => {
      if (!p.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtro === 'disponiveis') return p.status === 'Disponivel'
      if (filtro === 'reservados') return p.status === 'Reservado'
      if (filtro === 'comprados') return p.status === 'Comprado'
      // Cotas ainda não existem no backend
      if (filtro === 'cotas') return false
      return true
    })
  }, [presentes, busca, filtro])

  const lista = presentes ?? []
  const disponiveis = lista.filter((p) => p.status === 'Disponivel').length
  const reservados = lista.filter((p) => p.status === 'Reservado').length
  const comprados = lista.filter((p) => p.status === 'Comprado').length

  async function salvar(dados: DadosPresente) {
    if (edicao === 'novo') await criarPresente(eventoId, dados)
    else if (edicao) await atualizarPresente(eventoId, edicao.id, dados)
    setEdicao(null)
    recarregar()
  }

  async function excluir() {
    if (edicao && edicao !== 'novo') await excluirPresente(eventoId, edicao.id)
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

      <TituloDestaque>Lista de Presentes</TituloDestaque>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
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
      </div>

      {/* Adicionar presente */}
      <Botao
        className="mt-5 lg:max-w-xs"
        onClick={() => setEdicao('novo')}
        icone={<img src={circuloMais} alt="" width={24} height={24} />}
      >
        Adicionar Presente
      </Botao>

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
      </JanelaModal>
    </LayoutPainel>
  )
}
