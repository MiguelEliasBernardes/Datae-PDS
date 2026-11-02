import { useCallback, useMemo, useState } from 'react'
import olho from '../assets/eye.svg'
import circuloMais from '../assets/circle-plus.svg'
import casaBranca from '../assets/house-white.svg'
import emailConfirmado from '../assets/mail-check.svg'
import emailRecusado from '../assets/mail-x.svg'
import mensagemAviso from '../assets/message-square-warning.svg'
import engrenagem from '../assets/settings.svg'
import { atualizarConvidado, criarConvidado, excluirConvidado, listarConvidados } from '../api/convidados'
import type { Convidado, DadosConvidado } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { FormularioConvidado } from '../componentes/FormularioConvidado'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaConvidado } from '../componentes/LinhaConvidado'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { useCarregamento } from '../hooks/useCarregamento'

type Filtro = 'confirmados' | 'recusados' | 'observacoes'

/** Convidado em edição: null = janela fechada, 'novo' = adicionando. */
type Edicao = Convidado | 'novo' | null

/** Tela O5 - Gestão de Convidados. */
export function Convidados({
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
  const carregar = useCallback(() => listarConvidados(eventoId), [eventoId])
  const { dados: convidados, erro, carregando, recarregar } = useCarregamento(carregar)

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro | null>(null)
  const [edicao, setEdicao] = useState<Edicao>(null)

  const alternarFiltro = (f: Filtro) => setFiltro((atual) => (atual === f ? null : f))
  const fecharJanela = useCallback(() => setEdicao(null), [])

  const visiveis = useMemo(() => {
    return (convidados ?? []).filter((c) => {
      if (!c.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtro === 'confirmados') return c.statusPresenca === 'Confirmado'
      if (filtro === 'recusados') return c.statusPresenca === 'Recusado'
      if (filtro === 'observacoes') return Boolean(c.observacao)
      return true
    })
  }, [convidados, busca, filtro])

  const lista = convidados ?? []
  const pessoasConfirmadas = lista
    .filter((c) => c.statusPresenca === 'Confirmado')
    .reduce((total, c) => total + 1 + c.quantidadeAcompanhantes, 0)
  const recusados = lista.filter((c) => c.statusPresenca === 'Recusado').length
  const comObservacao = lista.filter((c) => c.observacao).length

  async function salvar(dados: DadosConvidado) {
    if (edicao === 'novo') await criarConvidado(eventoId, dados)
    else if (edicao) await atualizarConvidado(eventoId, edicao.id, dados)
    setEdicao(null)
    recarregar()
  }

  async function excluir() {
    if (edicao && edicao !== 'novo') await excluirConvidado(eventoId, edicao.id)
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

      <TituloDestaque>Convidados</TituloDestaque>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        <CartaoEstatistica
          icone={emailConfirmado}
          valor={String(pessoasConfirmadas)}
          tom="lilas"
          rotulo={
            <>
              Confirmados{' '}
              <span className="text-[9px] font-normal">
                (Convidados e acompanhantes)
              </span>
            </>
          }
        />
        <CartaoEstatistica icone={emailRecusado} valor={String(recusados)} tom="rosa" rotulo="Recusados" />
        <CartaoEstatistica icone={mensagemAviso} valor={String(comObservacao)} tom="pessego" rotulo="Observações" />
      </div>

      {/* Adicionar convidado */}
      <Botao
        className="mt-5 lg:max-w-xs"
        onClick={() => setEdicao('novo')}
        icone={<img src={circuloMais} alt="" width={24} height={24} />}
      >
        Adicionar Convidado
      </Botao>

      {/* Busca */}
      <CampoTexto
        className="mt-4 lg:max-w-md"
        name="busca-convidado"
        placeholder="Convidado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <ChipFiltro rotulo="Confirmados" ativo={filtro === 'confirmados'} onClick={() => alternarFiltro('confirmados')} />
        <ChipFiltro rotulo="Recusados" ativo={filtro === 'recusados'} onClick={() => alternarFiltro('recusados')} />
        <ChipFiltro rotulo="Observações" ativo={filtro === 'observacoes'} onClick={() => alternarFiltro('observacoes')} />
      </div>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Lista de convidados */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {carregando && !convidados ? (
          <MensagemLista>Carregando convidados...</MensagemLista>
        ) : visiveis.length > 0 ? (
          visiveis.map((c) => (
            <LinhaConvidado
              key={c.id}
              nome={c.nome}
              status={c.statusPresenca}
              acompanhantes={c.quantidadeAcompanhantes}
              observacao={c.observacao}
              onEditar={() => setEdicao(c)}
            />
          ))
        ) : (
          convidados && <MensagemLista>Nenhum convidado encontrado.</MensagemLista>
        )}
      </div>

      <JanelaModal
        titulo={edicao === 'novo' ? 'Adicionar convidado' : 'Editar convidado'}
        aberta={edicao !== null}
        onFechar={fecharJanela}
      >
        {edicao !== null && (
          <FormularioConvidado
            // key recria o formulário com os dados certos ao trocar de convidado
            key={edicao === 'novo' ? 'novo' : edicao.id}
            convidado={edicao === 'novo' ? undefined : edicao}
            onSalvar={salvar}
            onExcluir={edicao === 'novo' ? undefined : excluir}
          />
        )}
      </JanelaModal>
    </LayoutPainel>
  )
}
