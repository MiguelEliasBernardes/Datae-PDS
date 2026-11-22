import { useCallback, useState } from 'react'
import { obterStatusAssistente, sugerirPresentes } from '../api/assistente'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { criarPresente } from '../api/presentes'
import type { EstiloPresente, PresenteSugerido } from '../api/tipos'
import { formatarMoeda, lerValorMonetario, rotulosEstiloPresente } from '../dados/formatacao'
import { useCarregamento } from '../hooks/useCarregamento'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'
import { ChipFiltro } from './ChipFiltro'
import { MensagemLista } from './MensagemLista'

const estilos = Object.keys(rotulosEstiloPresente) as EstiloPresente[]

/**
 * Assistente de IA da lista de presentes: um questionário curto, as sugestões com caixas de seleção
 * e o botão que cria os presentes escolhidos (pela rota normal de presentes, com as validações de sempre).
 * Cada lista tem poucas gerações, então as sugestões ficam na tela até a janela ser fechada.
 */
export function AssistentePresentes({
  eventoId,
  minhaLista,
  onAdicionados,
}: {
  eventoId: number
  minhaLista: boolean
  onAdicionados: () => void
}) {
  const carregar = useCallback(() => obterStatusAssistente(eventoId, minhaLista), [eventoId, minhaLista])
  const { dados: status, erro: erroStatus, carregando, recarregar } = useCarregamento(carregar)

  const [valorMinimo, setValorMinimo] = useState('')
  const [valorMaximo, setValorMaximo] = useState('')
  const [escolhidosEstilos, setEscolhidosEstilos] = useState<EstiloPresente[]>([])
  const [quantidade, setQuantidade] = useState('10')
  const [observacoes, setObservacoes] = useState('')

  const [sugestoes, setSugestoes] = useState<PresenteSugerido[] | null>(null)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [restantes, setRestantes] = useState<number | null>(null)
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const geracoesRestantes = restantes ?? status?.geracoesRestantes ?? 0

  function alternarEstilo(estilo: EstiloPresente) {
    setEscolhidosEstilos((atual) => (atual.includes(estilo) ? atual.filter((e) => e !== estilo) : [...atual, estilo]))
  }

  function alternarSugestao(indice: number) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(indice)) novo.delete(indice)
      else novo.add(indice)
      return novo
    })
  }

  async function gerar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)

    const minimo = lerValorMonetario(valorMinimo)
    const maximo = lerValorMonetario(valorMaximo)
    const qtd = Number(quantidade)
    if ((minimo !== null && (Number.isNaN(minimo) || minimo < 0)) || (maximo !== null && (Number.isNaN(maximo) || maximo <= 0))) {
      setMensagem('Informe valores válidos, ex.: 50 e 500.')
      return
    }
    if (minimo !== null && maximo !== null && minimo > maximo) {
      setMensagem('O valor máximo precisa ser maior que o mínimo.')
      return
    }
    if (!Number.isInteger(qtd) || qtd < 5 || qtd > 20) {
      setMensagem('Peça de 5 a 20 sugestões.')
      return
    }

    setGerando(true)
    try {
      const resposta = await sugerirPresentes(eventoId, {
        minhaLista,
        valorMinimo: minimo,
        valorMaximo: maximo,
        estilos: escolhidosEstilos,
        quantidade: qtd,
        observacoes: observacoes.trim() || undefined,
      })
      setSugestoes(resposta.presentes)
      setSelecionados(new Set(resposta.presentes.map((_, i) => i)))
      setRestantes(resposta.geracoesRestantes)
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagem(mensagemDeErro(e))
    } finally {
      setGerando(false)
    }
  }

  async function adicionar() {
    if (!sugestoes) return
    setMensagem(null)
    setSalvando(true)
    const escolhidos = sugestoes.filter((_, i) => selecionados.has(i))
    let criados = 0
    try {
      // Um por vez, pela rota normal: cada presente passa pelas mesmas validações da criação manual
      for (const p of escolhidos) {
        await criarPresente(
          eventoId,
          {
            nome: p.nome,
            descricao: p.descricao ?? undefined,
            valorEstimado: p.valorEstimado,
            quantidadeCotas: p.quantidadeCotas ?? 0,
          },
          minhaLista,
        )
        criados++
      }
      onAdicionados()
    } catch (e) {
      // Tira da tela os que já foram criados, para não duplicar ao tentar de novo
      const restantesSugestoes = escolhidos.slice(criados)
      setSugestoes(restantesSugestoes)
      setSelecionados(new Set(restantesSugestoes.map((_, i) => i)))
      setMensagem(`${criados > 0 ? `${criados} adicionados. ` : ''}${mensagemDeErro(e)}`)
      setSalvando(false)
    }
  }

  if (!status) {
    return (
      <>
        <AvisoErro mensagem={erroStatus} onTentarNovamente={recarregar} />
        {carregando && <MensagemLista>Carregando...</MensagemLista>}
      </>
    )
  }

  if (!status.disponivel) {
    return <MensagemLista>O assistente de IA não está disponível neste servidor.</MensagemLista>
  }

  // Sugestões geradas: o organizador escolhe quais entram na lista
  if (sugestoes) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-muted">
          Desmarque o que não quiser. Os valores são estimativas: você pode editar cada presente depois.
        </p>
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {sugestoes.map((p, i) => (
            <label
              key={`${p.nome}-${i}`}
              className="flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-field-border p-3"
            >
              <input
                type="checkbox"
                checked={selecionados.has(i)}
                onChange={() => alternarSugestao(i)}
                className="mt-1 size-4 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-heading">{p.nome}</span>
                {p.descricao && <span className="block text-[12px] text-muted">{p.descricao}</span>}
                <span className="block font-display text-[11px] text-muted">
                  {p.valorEstimado !== null ? `≈ ${formatarMoeda(p.valorEstimado)}` : 'Sem valor'}
                  {p.quantidadeCotas !== null && ` · em ${p.quantidadeCotas} cotas`}
                </span>
              </span>
            </label>
          ))}
        </div>
        <AvisoErro mensagem={mensagem} />
        <Botao disabled={selecionados.size === 0} carregando={salvando} onClick={() => void adicionar()}>
          Adicionar à lista {selecionados.size > 0 && `(${selecionados.size})`}
        </Botao>
        {geracoesRestantes > 0 && (
          <Botao variante="secundario" disabled={salvando} onClick={() => setSugestoes(null)}>
            Ajustar o pedido e gerar de novo
          </Botao>
        )}
        <p className="text-center text-[11px] text-muted">
          {geracoesRestantes === 0
            ? 'Esta foi a última sugestão disponível para esta lista.'
            : `Restam ${geracoesRestantes} ${geracoesRestantes === 1 ? 'geração' : 'gerações'}.`}
        </p>
      </div>
    )
  }

  if (geracoesRestantes === 0) {
    return (
      <MensagemLista>
        Você já usou as {status.limiteGeracoes} sugestões do assistente disponíveis para esta lista.
      </MensagemLista>
    )
  }

  return (
    <form onSubmit={gerar} className="flex flex-col gap-4" noValidate>
      <p className="text-[12px] text-muted">
        Responda algumas perguntas e o assistente sugere presentes para a sua lista. Nada é adicionado sem a sua
        escolha. Restam {geracoesRestantes} de {status.limiteGeracoes} gerações.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <CampoTexto
          rotulo="Valor mínimo (R$)"
          name="valorMinimo"
          inputMode="decimal"
          placeholder="Ex.: 50"
          value={valorMinimo}
          onChange={(e) => setValorMinimo(e.target.value)}
          erro={erro?.doCampo('valorMinimo')}
        />
        <CampoTexto
          rotulo="Valor máximo (R$)"
          name="valorMaximo"
          inputMode="decimal"
          placeholder="Ex.: 800"
          value={valorMaximo}
          onChange={(e) => setValorMaximo(e.target.value)}
          erro={erro?.doCampo('valorMaximo')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-heading">Estilos (opcional)</span>
        <div className="flex flex-wrap gap-2">
          {estilos.map((estilo) => (
            <ChipFiltro
              key={estilo}
              rotulo={rotulosEstiloPresente[estilo]}
              ativo={escolhidosEstilos.includes(estilo)}
              onClick={() => alternarEstilo(estilo)}
            />
          ))}
        </div>
      </div>

      <CampoTexto
        rotulo="Quantas sugestões (5 a 20)"
        name="quantidade"
        type="number"
        min={5}
        max={20}
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        erro={erro?.doCampo('quantidade')}
      />

      <AreaTexto
        rotulo="Algo mais? (opcional)"
        name="observacoes"
        maxLength={500}
        placeholder="Ex.: já temos geladeira e fogão; adoramos café e viagens."
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        erro={erro?.doCampo('observacoes')}
      />

      <AvisoErro mensagem={mensagem} />
      <Botao type="submit" carregando={gerando}>
        {gerando ? 'Gerando...' : 'Gerar sugestões'}
      </Botao>
    </form>
  )
}
