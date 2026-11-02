import { useMemo, useState } from 'react'
import circuloMais from '../assets/circle-plus.svg'
import olho from '../assets/eye.svg'
import capelo from '../assets/graduation-cap.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaMembro, type Membro } from '../componentes/LinhaMembro'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'

/** Dados de exemplo: formandos ainda não têm backend. */
const membros: Membro[] = [
  { nome: 'Ana Silva', papel: 'membro' },
  { nome: 'João', papel: 'administrador' },
  { nome: 'Beatriz Lima', papel: 'membro' },
  { nome: 'Carlos Souza', papel: 'membro' },
  { nome: 'Marina Dias', papel: 'administrador' },
]

type Filtro = 'membro' | 'administrador'

/** Tela F2 - Formandos. */
export function Formandos({
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
    return membros.filter((m) => {
      if (!m.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtro) return m.papel === filtro
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

      <TituloDestaque>Formandos</TituloDestaque>

      {/* Estatística */}
      <div className="mt-5 lg:max-w-sm">
        <CartaoEstatistica
          icone={capelo}
          valor={String(membros.length)}
          tom="lilas"
          rotulo="Formandos Cadastrados"
        />
      </div>

      {/* Adicionar formando */}
      <Botao
        className="mt-5 lg:max-w-xs"
        icone={<img src={circuloMais} alt="" width={24} height={24} />}
      >
        Adicionar Formando
      </Botao>

      {/* Busca */}
      <CampoTexto
        className="mt-4 lg:max-w-md"
        name="busca-formando"
        placeholder="Formando..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {/* Filtros */}
      <div className="mt-3 flex gap-2">
        <ChipFiltro rotulo="Membro" ativo={filtro === 'membro'} onClick={() => alternarFiltro('membro')} />
        <ChipFiltro
          rotulo="Administrador"
          ativo={filtro === 'administrador'}
          onClick={() => alternarFiltro('administrador')}
        />
      </div>

      {/* Lista de formandos */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {visiveis.length > 0 ? (
          visiveis.map((m) => <LinhaMembro key={m.nome} {...m} />)
        ) : (
          <MensagemLista>Nenhum formando encontrado.</MensagemLista>
        )}
      </div>
    </LayoutPainel>
  )
}
