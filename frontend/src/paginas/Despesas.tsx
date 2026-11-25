import { useCallback, useMemo, useState } from 'react'
import notaDinheiro from '../assets/banknote-stat.svg'
import circuloMais from '../assets/circle-plus.svg'
import circuloCifrao from '../assets/circle-dollar-sign.svg'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { atualizarDespesa, criarDespesa, excluirDespesa, listarDespesas } from '../api/formatura'
import type { DadosDespesa, Despesa } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CarrosselEstatisticas } from '../componentes/CarrosselEstatisticas'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { FormularioDespesa } from '../componentes/FormularioDespesa'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaDespesa } from '../componentes/LinhaDespesa'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarData, formatarMoeda } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

/** Despesa em edição: null = janela fechada, 'novo' = adicionando. */
type Edicao = Despesa | 'novo' | null

/**
 * Tela F3 - Despesas da formatura (o total é dividido entre os formandos no Rateio).
 * Todo formando vê as despesas; só o financeiro (`somenteLeitura` = false) lança e altera.
 */
export function Despesas({
  eventoId,
  somenteLeitura,
  onVoltar,
  onAbrirRateio,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  somenteLeitura: boolean
  onVoltar: () => void
  onAbrirRateio: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => listarDespesas(eventoId), [eventoId])
  const { dados: despesas, erro, carregando, recarregar } = useCarregamento(carregar)

  const [busca, setBusca] = useState('')
  const [edicao, setEdicao] = useState<Edicao>(null)
  const fecharJanela = useCallback(() => setEdicao(null), [])

  const visiveis = useMemo(
    () => (despesas ?? []).filter((d) => d.descricao.toLowerCase().includes(busca.toLowerCase())),
    [despesas, busca],
  )
  const total = (despesas ?? []).reduce((soma, d) => soma + d.valor, 0)

  async function salvar(dados: DadosDespesa) {
    if (edicao === 'novo') await criarDespesa(eventoId, dados)
    else if (edicao) await atualizarDespesa(eventoId, edicao.id, dados)
    setEdicao(null)
    recarregar()
  }

  async function excluir() {
    if (edicao && edicao !== 'novo') await excluirDespesa(eventoId, edicao.id)
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

      <TituloDestaque>Despesas</TituloDestaque>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <CarrosselEstatisticas className="mt-5">
        <CartaoEstatistica icone={notaDinheiro} valor={formatarMoeda(total)} tom="lilas" rotulo="Total despesas" />
        <CartaoEstatistica
          icone={circuloCifrao}
          valor={String(despesas?.length ?? 0)}
          tom="pessego"
          rotulo="Despesas cadastradas"
        />
      </CarrosselEstatisticas>

      <div className="mt-5 flex flex-col gap-3 lg:max-w-xl lg:flex-row">
        {!somenteLeitura && (
          <Botao onClick={() => setEdicao('novo')} icone={<img src={circuloMais} alt="" width={24} height={24} />}>
            Adicionar Despesa
          </Botao>
        )}
        <Botao variante="secundario" onClick={onAbrirRateio}>
          {somenteLeitura ? 'Ver minha parte' : 'Ver rateio'}
        </Botao>
      </div>

      {/* Busca */}
      <CampoTexto
        className="mt-4 lg:max-w-md"
        name="busca-despesa"
        placeholder="Despesa..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Lista de despesas */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {carregando && !despesas ? (
          <MensagemLista>Carregando despesas...</MensagemLista>
        ) : visiveis.length > 0 ? (
          visiveis.map((d) => (
            <LinhaDespesa
              key={d.id}
              descricao={d.descricao}
              valor={formatarMoeda(d.valor)}
              data={d.data ? formatarData(d.data) : null}
              onEditar={somenteLeitura ? undefined : () => setEdicao(d)}
            />
          ))
        ) : (
          despesas && (
            <MensagemLista>
              {despesas.length === 0 ? 'Nenhuma despesa cadastrada ainda.' : 'Nenhuma despesa encontrada.'}
            </MensagemLista>
          )
        )}
      </div>

      <JanelaModal
        titulo={edicao === 'novo' ? 'Adicionar despesa' : 'Editar despesa'}
        aberta={edicao !== null}
        onFechar={fecharJanela}
      >
        {edicao !== null && (
          <FormularioDespesa
            // key recria o formulário com os dados certos ao trocar de despesa
            key={edicao === 'novo' ? 'novo' : edicao.id}
            despesa={edicao === 'novo' ? undefined : edicao}
            onSalvar={salvar}
            onExcluir={edicao === 'novo' ? undefined : excluir}
          />
        )}
      </JanelaModal>
    </LayoutPainel>
  )
}
