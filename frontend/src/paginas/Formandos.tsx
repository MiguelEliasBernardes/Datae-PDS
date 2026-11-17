import { useCallback, useMemo, useState } from 'react'
import circuloMais from '../assets/circle-plus.svg'
import olho from '../assets/eye.svg'
import capelo from '../assets/graduation-cap.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { obterEvento } from '../api/eventos'
import { atualizarFormando, criarFormando, excluirFormando, listarFormandos } from '../api/formatura'
import type { DadosFormando, Evento, Formando, PapelFormando } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { CartaoEstatistica } from '../componentes/CartaoEstatistica'
import { ChipFiltro } from '../componentes/ChipFiltro'
import { CodigoTurma } from '../componentes/CodigoTurma'
import { ConviteFormando } from '../componentes/ConviteFormando'
import { FormularioFormando } from '../componentes/FormularioFormando'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { LinhaMembro } from '../componentes/LinhaMembro'
import { MensagemLista } from '../componentes/MensagemLista'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { rotulosPapelFormando } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

const papeis = Object.keys(rotulosPapelFormando) as PapelFormando[]

/** Formando em edição: null = janela fechada, 'novo' = adicionando. */
type Edicao = Formando | 'novo' | null

/**
 * Tela F2 - Formandos (comissão da formatura). Aqui o organizador e os administradores
 * cadastram os formandos, escolhem o papel de cada um e enviam os convites.
 */
export function Formandos({
  eventoId,
  onVoltar,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(() => Promise.all([listarFormandos(eventoId), obterEvento(eventoId)]), [eventoId])
  const { dados, erro, carregando, recarregar } = useCarregamento(carregar)
  const formandos = dados?.[0] ?? null
  // O código da turma muda sem recarregar a lista inteira
  const [eventoAtualizado, setEventoAtualizado] = useState<Evento | null>(null)
  const evento = eventoAtualizado ?? dados?.[1] ?? null

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<PapelFormando | null>(null)
  const [edicao, setEdicao] = useState<Edicao>(null)

  const alternarFiltro = (f: PapelFormando) => setFiltro((atual) => (atual === f ? null : f))
  const fecharJanela = useCallback(() => setEdicao(null), [])

  const visiveis = useMemo(() => {
    return (formandos ?? []).filter((f) => {
      if (!f.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtro) return f.papel === filtro
      return true
    })
  }, [formandos, busca, filtro])

  async function salvar(dados: DadosFormando) {
    if (edicao === 'novo') {
      // Ao adicionar, a janela continua aberta mostrando o convite pronto para enviar
      setEdicao(await criarFormando(eventoId, dados))
    } else if (edicao) {
      await atualizarFormando(eventoId, edicao.id, dados)
      setEdicao(null)
    }
    recarregar()
  }

  function aoAlterarConvite(formando: Formando) {
    setEdicao(formando)
    recarregar()
  }

  async function excluir() {
    if (edicao && edicao !== 'novo') await excluirFormando(eventoId, edicao.id)
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

      <TituloDestaque>Formandos</TituloDestaque>

      {evento && (
        <div className="mt-5">
          <CodigoTurma evento={evento} onAlterado={setEventoAtualizado} />
        </div>
      )}

      {/* Estatística */}
      <div className="mt-5 lg:max-w-sm">
        <CartaoEstatistica
          icone={capelo}
          valor={String(formandos?.length ?? 0)}
          tom="lilas"
          rotulo="Formandos Cadastrados"
        />
      </div>

      {/* Adicionar formando */}
      <Botao
        className="mt-5 lg:max-w-xs"
        onClick={() => setEdicao('novo')}
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
      <div className="mt-3 flex flex-wrap gap-2">
        {papeis.map((p) => (
          <ChipFiltro key={p} rotulo={rotulosPapelFormando[p]} ativo={filtro === p} onClick={() => alternarFiltro(p)} />
        ))}
      </div>

      <AvisoErro className="mt-4" mensagem={erro} onTentarNovamente={recarregar} />

      {/* Lista de formandos */}
      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-6 lg:gap-y-4 lg:overflow-visible">
        {carregando && !formandos ? (
          <MensagemLista>Carregando formandos...</MensagemLista>
        ) : visiveis.length > 0 ? (
          visiveis.map((f) => (
            <LinhaMembro
              key={f.id}
              nome={f.nome}
              papel={f.papel}
              email={f.email}
              vinculado={f.vinculado}
              onEditar={() => setEdicao(f)}
            />
          ))
        ) : (
          formandos && <MensagemLista>Nenhum formando encontrado.</MensagemLista>
        )}
      </div>

      <JanelaModal
        titulo={edicao === 'novo' ? 'Adicionar formando' : 'Editar formando'}
        aberta={edicao !== null}
        onFechar={fecharJanela}
      >
        {edicao !== null && (
          <FormularioFormando
            // key recria o formulário com os dados certos ao trocar de formando
            key={edicao === 'novo' ? 'novo' : edicao.id}
            formando={edicao === 'novo' ? undefined : edicao}
            onSalvar={salvar}
            onExcluir={edicao === 'novo' ? undefined : excluir}
          />
        )}
        {edicao !== null && edicao !== 'novo' && (
          <ConviteFormando eventoId={eventoId} formando={edicao} onAlterado={aoAlterarConvite} />
        )}
      </JanelaModal>
    </LayoutPainel>
  )
}
