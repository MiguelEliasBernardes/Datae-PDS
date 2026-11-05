import { useState } from 'react'
import setaDireita from '../assets/arrow-big-right.svg'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { confirmarPresenca } from '../api/publico'
import type { Presenca } from '../api/tipos'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'

const MAXIMO_ACOMPANHANTES = 10

const classeOpcao = (selecionada: boolean) =>
  `h-[46px] rounded-[10px] border-[1.5px] text-[13px] font-bold transition-colors ${
    selecionada ? 'border-primary bg-primary text-surface' : 'border-field-border bg-surface text-muted'
  }`

/**
 * RSVP da página pública: o convidado diz se vai, quantos acompanhantes leva e
 * alguma observação (ex.: restrição alimentar). Se o nome já estiver na lista do
 * organizador, a resposta é atualizada; senão, o convidado entra na lista.
 */
export function FormularioPresenca({ slug, somenteLeitura = false }: { slug: string; somenteLeitura?: boolean }) {
  const [vaiComparecer, setVaiComparecer] = useState<boolean | null>(null)
  const [nome, setNome] = useState('')
  const [acompanhantes, setAcompanhantes] = useState('')
  const [observacao, setObservacao] = useState('')

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resposta, setResposta] = useState<Presenca | null>(null)

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    // Validação no navegador, antes de chamar a API
    const quantidade = acompanhantes.trim() ? Number(acompanhantes) : 0
    if (vaiComparecer === null) {
      setMensagemGeral('Escolha "Vou" ou "Não vou".')
      return
    }
    if (!nome.trim()) {
      setMensagemGeral('Informe seu nome.')
      return
    }
    if (!Number.isInteger(quantidade) || quantidade < 0 || quantidade > MAXIMO_ACOMPANHANTES) {
      setMensagemGeral(`Informe de 0 a ${MAXIMO_ACOMPANHANTES} acompanhantes.`)
      return
    }

    setMensagemGeral(null)
    setEnviando(true)
    try {
      setResposta(
        await confirmarPresenca(slug, {
          nome,
          vaiComparecer,
          quantidadeAcompanhantes: vaiComparecer ? quantidade : 0,
          observacao,
        }),
      )
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  if (resposta) {
    const confirmado = resposta.statusPresenca === 'Confirmado'
    const pessoas = resposta.quantidadeAcompanhantes
    return (
      <div role="status" className="rounded-[12px] bg-badge p-5">
        <p className="font-heading text-[17px] font-bold text-heading">
          {confirmado ? `Oba, ${resposta.nome}! Te esperamos lá.` : `Que pena, ${resposta.nome}. Obrigado por avisar!`}
        </p>
        {confirmado && pessoas > 0 && (
          <p className="mt-1 text-[13px] text-muted">
            Presença confirmada para você e mais {pessoas} {pessoas === 1 ? 'acompanhante' : 'acompanhantes'}.
          </p>
        )}
        <button type="button" onClick={() => setResposta(null)} className="mt-3 text-[13px] font-medium text-primary underline">
          Alterar resposta
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={aoEnviar} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setVaiComparecer(true)}
          aria-pressed={vaiComparecer === true}
          className={classeOpcao(vaiComparecer === true)}
        >
          Vou
        </button>
        <button
          type="button"
          onClick={() => setVaiComparecer(false)}
          aria-pressed={vaiComparecer === false}
          className={classeOpcao(vaiComparecer === false)}
        >
          Não vou
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <CampoTexto
          name="presenca-nome"
          placeholder="Seu nome"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erro?.doCampo('nome')}
        />
        <CampoTexto
          name="presenca-acompanhantes"
          placeholder="Acompanhantes: 0"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAXIMO_ACOMPANHANTES}
          disabled={vaiComparecer === false}
          value={vaiComparecer === false ? '' : acompanhantes}
          onChange={(e) => setAcompanhantes(e.target.value)}
          erro={erro?.doCampo('quantidadeAcompanhantes')}
        />
      </div>
      <CampoTexto
        className="mt-3"
        name="presenca-observacao"
        placeholder="Restrição alimentar ou recado? (opcional)"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        erro={erro?.doCampo('observacao')}
      />

      <AvisoErro className="mt-3" mensagem={mensagemGeral} />

      <Botao
        type="submit"
        className="mt-4"
        carregando={enviando}
        disabled={somenteLeitura}
        icone={<img src={setaDireita} alt="" width={24} height={24} />}
      >
        Enviar confirmação
      </Botao>
    </form>
  )
}
