import { useCallback, useState } from 'react'
import olho from '../assets/eye.svg'
import casaBranca from '../assets/house-white.svg'
import engrenagem from '../assets/settings.svg'
import { obterStatusAssistente, sugerirRoteiro } from '../api/assistente'
import { criarItemChecklist } from '../api/checklist'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { obterEvento } from '../api/eventos'
import type { BrincadeiraSugerida, DadosItemChecklist, MomentoRoteiro, PublicoEvento } from '../api/tipos'
import { AreaTexto } from '../componentes/AreaTexto'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { BotaoOpcao } from '../componentes/BotaoOpcao'
import { BotaoVoltar } from '../componentes/BotaoVoltar'
import { CampoTexto } from '../componentes/CampoTexto'
import { JanelaModal } from '../componentes/JanelaModal'
import { LayoutPainel } from '../componentes/LayoutPainel'
import { MensagemLista } from '../componentes/MensagemLista'
import { RotuloSecao } from '../componentes/RotuloSecao'
import { TituloDestaque } from '../componentes/TituloDestaque'
import { paraCampoDataHora, rotulosPublicoEvento } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'

const publicos = Object.keys(rotulosPublicoEvento) as PublicoEvento[]

/** Sugestão marcada para ir à checklist: "m-0" é um momento do roteiro e "b-0" uma brincadeira. */
type ChaveSugestao = `m-${number}` | `b-${number}`

function paraItemMomento(m: MomentoRoteiro): DadosItemChecklist {
  return {
    titulo: `${m.horario} · ${m.titulo}`.slice(0, 150),
    descricao: m.descricao ?? undefined,
    categoria: 'Cerimonia',
    diasAntes: 0,
  }
}

function paraItemBrincadeira(b: BrincadeiraSugerida): DadosItemChecklist {
  const descricao = [b.descricao, b.materiais && `Materiais: ${b.materiais}`].filter(Boolean).join('\n')
  return { titulo: b.titulo, descricao: descricao.slice(0, 500) || undefined, categoria: 'Brincadeiras' }
}

/**
 * Roteiro com IA: o assistente monta a linha do tempo do evento e sugere brincadeiras.
 * O que o organizador marcar vira tarefa da checklist (momentos em "Cerimônia", no dia do evento;
 * brincadeiras em "Brincadeiras"). O roteiro gerado não fica gravado: só o que vai para a checklist.
 */
export function Roteiro({
  eventoId,
  onVoltar,
  onAbrirChecklist,
  onAbrirConfiguracoes,
  onAbrirVisualizacao,
}: {
  eventoId: number
  onVoltar: () => void
  onAbrirChecklist: () => void
  onAbrirConfiguracoes?: () => void
  onAbrirVisualizacao: () => void
}) {
  const carregar = useCallback(
    () => Promise.all([obterEvento(eventoId), obterStatusAssistente(eventoId)]),
    [eventoId],
  )
  const { dados, erro: erroCarregar, carregando, recarregar } = useCarregamento(carregar)
  const [evento, status] = dados ?? [null, null]

  const [horario, setHorario] = useState<string | null>(null)
  const [duracao, setDuracao] = useState('4')
  const [publico, setPublico] = useState<PublicoEvento>('Adultos')
  const [observacoes, setObservacoes] = useState('')

  const [momentos, setMomentos] = useState<MomentoRoteiro[] | null>(null)
  const [brincadeiras, setBrincadeiras] = useState<BrincadeiraSugerida[]>([])
  const [selecionadas, setSelecionadas] = useState<Set<ChaveSugestao>>(new Set())
  const [restantes, setRestantes] = useState<number | null>(null)
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [adicionados, setAdicionados] = useState(0)
  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  // O horário começa com a hora do evento (no fuso de quem está vendo)
  const horarioInicio = horario ?? (evento ? paraCampoDataHora(evento.dataEvento).slice(11, 16) : '')
  const geracoesRestantes = restantes ?? status?.geracoesRestantes ?? 0

  function alternar(chave: ChaveSugestao) {
    setSelecionadas((atual) => {
      const nova = new Set(atual)
      if (nova.has(chave)) nova.delete(chave)
      else nova.add(chave)
      return nova
    })
  }

  async function gerar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    const horas = Number(duracao)
    if (!/^\d{2}:\d{2}$/.test(horarioInicio)) {
      setMensagem('Informe o horário de início.')
      return
    }
    if (!Number.isInteger(horas) || horas < 1 || horas > 12) {
      setMensagem('Informe uma duração de 1 a 12 horas.')
      return
    }

    setGerando(true)
    try {
      const roteiro = await sugerirRoteiro(eventoId, {
        horarioInicio,
        duracaoHoras: horas,
        publico,
        observacoes: observacoes.trim() || undefined,
      })
      setMomentos(roteiro.momentos)
      setBrincadeiras(roteiro.brincadeiras)
      setSelecionadas(
        new Set<ChaveSugestao>([
          ...roteiro.momentos.map((_, i) => `m-${i}` as const),
          ...roteiro.brincadeiras.map((_, i) => `b-${i}` as const),
        ]),
      )
      setRestantes(roteiro.geracoesRestantes)
      setAdicionados(0)
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagem(mensagemDeErro(e))
    } finally {
      setGerando(false)
    }
  }

  async function adicionarNaChecklist() {
    if (!momentos) return
    setMensagem(null)
    setSalvando(true)
    const restantesMomentos = [...momentos]
    const restantesBrincadeiras = [...brincadeiras]
    let criados = 0
    try {
      // Um por vez, pela rota normal da checklist; o que já foi criado sai da tela
      for (const [i, m] of momentos.entries()) {
        if (!selecionadas.has(`m-${i}`)) continue
        await criarItemChecklist(eventoId, paraItemMomento(m))
        restantesMomentos.splice(restantesMomentos.indexOf(m), 1)
        criados++
      }
      for (const [i, b] of brincadeiras.entries()) {
        if (!selecionadas.has(`b-${i}`)) continue
        await criarItemChecklist(eventoId, paraItemBrincadeira(b))
        restantesBrincadeiras.splice(restantesBrincadeiras.indexOf(b), 1)
        criados++
      }
    } catch (e) {
      setMensagem(mensagemDeErro(e))
    } finally {
      setMomentos(restantesMomentos)
      setBrincadeiras(restantesBrincadeiras)
      setSelecionadas(new Set())
      setAdicionados((total) => total + criados)
      setSalvando(false)
    }
  }

  // O roteiro gerado só existe nesta tela: sair com sugestões que não foram para a checklist pede confirmação
  const temSugestoesNaoSalvas = momentos !== null && momentos.length + brincadeiras.length > 0
  const [saidaPendente, setSaidaPendente] = useState<(() => void) | null>(null)
  const cancelarSaida = useCallback(() => setSaidaPendente(null), [])
  const sairCom = (acao: () => void) => () => {
    if (temSugestoesNaoSalvas) setSaidaPendente(() => acao)
    else acao()
  }

  const navegacao = [
    { icone: casaBranca, rotulo: 'Inicio', onClick: sairCom(onVoltar) },
    { icone: olho, rotulo: 'Visualizar', onClick: sairCom(onAbrirVisualizacao) },
    { icone: engrenagem, rotulo: 'Configurações', onClick: onAbrirConfiguracoes && sairCom(onAbrirConfiguracoes) },
  ]

  function conteudo() {
    if (!status) {
      return (
        <>
          <AvisoErro className="mt-4" mensagem={erroCarregar} onTentarNovamente={recarregar} />
          {carregando && <MensagemLista>Carregando...</MensagemLista>}
        </>
      )
    }

    if (!status.disponivel) {
      return <MensagemLista>O assistente de IA não está disponível neste servidor.</MensagemLista>
    }

    if (momentos) {
      const vazio = momentos.length === 0 && brincadeiras.length === 0
      return (
        <div className="mt-5 flex flex-col gap-5 lg:max-w-2xl">
          {adicionados > 0 && (
            <div className="flex flex-col gap-2 rounded-[12px] bg-badge p-4">
              <p className="text-[13px] font-medium text-heading">
                {adicionados} {adicionados === 1 ? 'item foi adicionado' : 'itens foram adicionados'} à checklist.
              </p>
              <Botao tamanho="pequeno" variante="secundario" className="sm:max-w-xs" onClick={sairCom(onAbrirChecklist)}>
                Abrir a checklist
              </Botao>
            </div>
          )}

          {momentos.length > 0 && (
            <section className="flex flex-col gap-2">
              <RotuloSecao>LINHA DO TEMPO</RotuloSecao>
              {momentos.map((m, i) => (
                <label
                  key={`m-${i}`}
                  className="flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-field-border p-3"
                >
                  <input
                    type="checkbox"
                    checked={selecionadas.has(`m-${i}`)}
                    onChange={() => alternar(`m-${i}`)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="w-12 shrink-0 font-display text-[14px] font-bold text-primary">{m.horario}</span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-heading">{m.titulo}</span>
                    {m.descricao && <span className="block text-[12px] text-muted">{m.descricao}</span>}
                  </span>
                </label>
              ))}
            </section>
          )}

          {brincadeiras.length > 0 && (
            <section className="flex flex-col gap-2">
              <RotuloSecao>BRINCADEIRAS</RotuloSecao>
              {brincadeiras.map((b, i) => (
                <label
                  key={`b-${i}`}
                  className="flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-field-border p-3"
                >
                  <input
                    type="checkbox"
                    checked={selecionadas.has(`b-${i}`)}
                    onChange={() => alternar(`b-${i}`)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-heading">{b.titulo}</span>
                    {b.descricao && <span className="block text-[12px] text-muted">{b.descricao}</span>}
                    {b.materiais && (
                      <span className="block font-display text-[11px] text-muted">Materiais: {b.materiais}</span>
                    )}
                  </span>
                </label>
              ))}
            </section>
          )}

          {vazio && <MensagemLista>Todas as sugestões escolhidas já estão na checklist.</MensagemLista>}

          <AvisoErro mensagem={mensagem} />
          {!vazio && (
            <>
              <p className="text-[12px] text-muted">
                O roteiro não fica salvo: o que você marcar vira tarefa da checklist.
              </p>
              <Botao
                className="lg:max-w-xs"
                disabled={selecionadas.size === 0}
                carregando={salvando}
                onClick={() => void adicionarNaChecklist()}
              >
                Adicionar à checklist {selecionadas.size > 0 && `(${selecionadas.size})`}
              </Botao>
            </>
          )}
          {geracoesRestantes > 0 && (
            <Botao className="lg:max-w-xs" variante="secundario" disabled={salvando} onClick={() => setMomentos(null)}>
              Ajustar o pedido e gerar de novo
            </Botao>
          )}
          <p className="text-[11px] text-muted">
            {geracoesRestantes === 0
              ? 'Esta foi a última sugestão do assistente disponível para este evento.'
              : `Restam ${geracoesRestantes} ${geracoesRestantes === 1 ? 'geração' : 'gerações'} do assistente para este evento.`}
          </p>
        </div>
      )
    }

    if (geracoesRestantes === 0) {
      return (
        <MensagemLista>
          Você já usou as {status.limiteGeracoes} sugestões do assistente disponíveis para este evento.
        </MensagemLista>
      )
    }

    return (
      <form onSubmit={gerar} className="mt-5 flex flex-col gap-4 lg:max-w-xl" noValidate>
        <p className="text-[12px] text-muted">
          Conte como vai ser o evento e o assistente monta a linha do tempo e sugere brincadeiras. As gerações
          são compartilhadas com as sugestões de presentes: restam {geracoesRestantes} de {status.limiteGeracoes}.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <CampoTexto
            rotulo="Começa às"
            name="horarioInicio"
            type="time"
            value={horarioInicio}
            onChange={(e) => setHorario(e.target.value)}
            erro={erro?.doCampo('horarioInicio')}
          />
          <CampoTexto
            rotulo="Duração (horas)"
            name="duracaoHoras"
            type="number"
            min={1}
            max={12}
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            erro={erro?.doCampo('duracaoHoras')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-heading">Quem vai ao evento</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {publicos.map((p) => (
              <BotaoOpcao key={p} rotulo={rotulosPublicoEvento[p]} selecionado={publico === p} onClick={() => setPublico(p)} />
            ))}
          </div>
        </div>

        <AreaTexto
          rotulo="Algo mais? (opcional)"
          name="observacoes"
          maxLength={500}
          placeholder="Ex.: festa ao ar livre, tema praia, queremos um momento para homenagear os avós."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          erro={erro?.doCampo('observacoes')}
        />

        <AvisoErro mensagem={mensagem} />
        <Botao type="submit" className="lg:max-w-xs" carregando={gerando}>
          {gerando ? 'Gerando...' : 'Gerar roteiro'}
        </Botao>
      </form>
    )
  }

  return (
    <LayoutPainel itens={navegacao}>
      <BotaoVoltar onVoltar={sairCom(onVoltar)} />
      <TituloDestaque>Roteiro com IA</TituloDestaque>
      {conteudo()}

      <JanelaModal titulo="Sair sem salvar o roteiro?" aberta={saidaPendente !== null} onFechar={cancelarSaida}>
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text">
            O roteiro sugerido não fica salvo. Se sair agora, as sugestões que você não adicionou à checklist serão
            perdidas, e gerar de novo usa mais uma das gerações do assistente.
          </p>
          <Botao onClick={cancelarSaida}>Continuar no roteiro</Botao>
          <Botao
            variante="perigo"
            onClick={() => {
              const acao = saidaPendente
              setSaidaPendente(null)
              acao?.()
            }}
          >
            Sair mesmo assim
          </Botao>
        </div>
      </JanelaModal>
    </LayoutPainel>
  )
}
