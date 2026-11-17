import { useCallback, useMemo, useState } from 'react'
import seloPercentual from '../assets/badge-percent.svg'
import notaDinheiro from '../assets/banknote-stat.svg'
import circuloCifrao from '../assets/circle-dollar-sign.svg'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { obterRateio } from '../api/formatura'
import type { RateioFormando } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaPagamento } from '../componentes/LinhaPagamento'
import { MensagemLista } from '../componentes/MensagemLista'
import { PagamentosFormando } from '../componentes/PagamentosFormando'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { formatarMoeda } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

type Filtro = 'pago' | 'pendente'

/**
 * Tela F4 - Rateio de Pagamentos: o total das despesas dividido igualmente entre os formandos.
 * O financeiro vê todos e registra pagamentos; os demais formandos veem os totais da turma e só
 * a própria parte (o backend já devolve só a linha deles).
 */
export function Rateio({
  eventoId,
  financeiro,
  onVoltar,
  onAbrirDespesas,
  onAbrirFormandos,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  financeiro: boolean
  onVoltar: () => void
  onAbrirDespesas: () => void
  onAbrirFormandos?: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => obterRateio(eventoId), [eventoId])
  const { dados: rateio, erro, carregando, recarregar } = useCarregamento(carregar)

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro | null>(null)
  // Guarda só o id: depois de registrar um pagamento, a janela mostra os valores recalculados
  const [formandoAberto, setFormandoAberto] = useState<number | null>(null)
  const fecharJanela = useCallback(() => setFormandoAberto(null), [])

  const alternarFiltro = (f: Filtro) => setFiltro((atual) => (atual === f ? null : f))

  const visiveis = useMemo(() => {
    return (rateio?.formandos ?? []).filter((f) => {
      if (!f.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtro === 'pago') return f.quitado
      if (filtro === 'pendente') return !f.quitado
      return true
    })
  }, [rateio, busca, filtro])

  const aberto: RateioFormando | undefined = rateio?.formandos.find((f) => f.formandoId === formandoAberto)

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />

      <TituloDestaque>{financeiro ? 'Rateio de Pagamentos' : 'Minha parte no rateio'}</TituloDestaque>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        <CartaoEstatistica
          icone={notaDinheiro}
          valor={formatarMoeda(rateio?.totalDespesas ?? 0)}
          tom="lilas"
          rotulo="Total despesas"
        />
        <CartaoEstatistica
          icone={seloPercentual}
          valor={`${rateio?.percentualPago ?? 0}%`}
          tom="menta"
          rotulo="Porcentagem paga"
        />
        <CartaoEstatistica
          icone={circuloCifrao}
          valor={formatarMoeda(rateio?.valorPorFormando ?? 0)}
          tom="pessego"
          rotulo="Valor por formando"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:max-w-xl lg:flex-row">
        <Botao variante="secundario" onClick={onAbrirDespesas}>
          {financeiro ? 'Gerenciar despesas' : 'Ver despesas'}
        </Botao>
        {onAbrirFormandos && (
          <Botao variante="secundario" onClick={onAbrirFormandos}>
            Gerenciar formandos
          </Botao>
        )}
      </div>

      {/* Busca e filtros só fazem sentido para quem vê a turma toda */}
      {financeiro && (
        <>
          <CampoTexto
            className="mt-5 lg:max-w-md"
            name="busca-rateio"
            placeholder="Formando..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <ChipFiltro rotulo="Pago" ativo={filtro === 'pago'} onClick={() => alternarFiltro('pago')} />
            <ChipFiltro rotulo="Pendente" ativo={filtro === 'pendente'} onClick={() => alternarFiltro('pendente')} />
          </div>
        </>
      )}

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Lista de rateio */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {carregando && !rateio ? (
          <MensagemLista>Carregando rateio...</MensagemLista>
        ) : visiveis.length > 0 ? (
          visiveis.map((f) => (
            <LinhaPagamento
              key={f.formandoId}
              nome={f.nome}
              status={f.quitado ? 'pago' : 'pendente'}
              pago={formatarMoeda(f.valorPago)}
              total={formatarMoeda(f.valorDevido)}
              percentual={f.percentual}
              rotuloAcao={financeiro ? 'Adicionar Pagamento' : 'Ver meus pagamentos'}
              onAdicionarPagamento={() => setFormandoAberto(f.formandoId)}
            />
          ))
        ) : (
          rateio && (
            <MensagemLista>
              {!financeiro
                ? 'Você organiza esta formatura, mas não participa do rateio como formando.'
                : rateio.formandos.length === 0
                  ? 'Cadastre os formandos para dividir as despesas.'
                  : 'Nenhum formando encontrado.'}
            </MensagemLista>
          )
        )}
      </div>

      <JanelaModal titulo={aberto ? `Pagamentos de ${aberto.nome}` : ''} aberta={aberto !== undefined} onFechar={fecharJanela}>
        {aberto && (
          <PagamentosFormando
            // key recria a janela ao trocar de formando
            key={aberto.formandoId}
            eventoId={eventoId}
            formando={aberto}
            somenteLeitura={!financeiro}
            onAlterado={recarregar}
          />
        )}
      </JanelaModal>
    </LayoutPainel>
  )
}
