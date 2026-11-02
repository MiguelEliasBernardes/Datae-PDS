import { useMemo, useState } from 'react'
import seloPercentual from '../assets/badge-percent.svg'
import notaDinheiro from '../assets/banknote-stat.svg'
import circuloCifrao from '../assets/circle-dollar-sign.svg'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaPagamento, type Pagamento } from '../componentes/LinhaPagamento'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'

/** Dados de exemplo: o rateio ainda não tem backend. */
const pagamentos: Pagamento[] = [
  { nome: 'Miguel', status: 'pendente', pago: 'R$ 199,90', total: 'R$ 256,97', percentual: 66 },
  { nome: 'Ana Silva', status: 'pago', pago: 'R$ 256,97', total: 'R$ 256,97', percentual: 100 },
  { nome: 'João', status: 'pendente', pago: 'R$ 100,00', total: 'R$ 256,97', percentual: 39 },
  { nome: 'Beatriz Lima', status: 'pago', pago: 'R$ 256,97', total: 'R$ 256,97', percentual: 100 },
]

type Filtro = 'pago' | 'pendente'

/** Tela F4 - Rateio de Pagamentos. */
export function Rateio({
  onVoltar,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  onVoltar: () => void
  onAbrirConfiguracoes: () => void
  onAbrirVisualizacao: () => void
}) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro | null>(null)

  const alternarFiltro = (f: Filtro) => setFiltro((atual) => (atual === f ? null : f))

  const visiveis = useMemo(() => {
    return pagamentos.filter((p) => {
      if (!p.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtro) return p.status === filtro
      return true
    })
  }, [busca, filtro])

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: onVoltar },
    { icone: olho, rotulo: 'Visualizar', onClick: onAbrirVisualizacao },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes },
  ]

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={onVoltar} />

      <TituloDestaque>Rateio de Pagamentos</TituloDestaque>

      {/* Estatísticas: carrossel no mobile, grade no desktop */}
      <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        <CartaoEstatistica icone={notaDinheiro} valor="R$ 2.678,99" tom="lilas" rotulo="Total despesas" />
        <CartaoEstatistica icone={seloPercentual} valor="80%" tom="menta" rotulo="Porcentagem paga" />
        <CartaoEstatistica icone={circuloCifrao} valor="R$ 256,97" tom="pessego" rotulo="Valor por formando" />
      </div>

      {/* Busca */}
      <CampoTexto
        className="mt-5 lg:max-w-md"
        name="busca-rateio"
        placeholder="Formando..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <ChipFiltro rotulo="Pago" ativo={filtro === 'pago'} onClick={() => alternarFiltro('pago')} />
        <ChipFiltro rotulo="Pendente" ativo={filtro === 'pendente'} onClick={() => alternarFiltro('pendente')} />
      </div>

      {/* Lista de rateio */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {visiveis.length > 0 ? (
          visiveis.map((p) => <LinhaPagamento key={p.nome} {...p} />)
        ) : (
          <MensagemLista>Nenhum formando encontrado.</MensagemLista>
        )}
      </div>
    </LayoutPainel>
  )
}
