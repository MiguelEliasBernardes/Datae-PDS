import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { cancelarReservaPresente, marcarPresenteComprado, reservarPresente } from '../api/publico'
import type { PresentePublico } from '../api/tipos'
import { esquecerReserva, guardarReserva } from '../dados/reservas'
import { formatarMoeda } from '../dados/formatacao'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'

/**
 * Conteúdo da janela de um presente na página pública.
 * - Disponível: o convidado informa o nome e reserva (ou já avisa que comprou).
 * - Reservado por este aparelho: pode marcar como comprado ou cancelar a reserva.
 * Ao terminar, chama `onConcluido` com uma mensagem para a página recarregar a lista.
 */
export function FormularioReserva({
  slug,
  presente,
  codigo,
  somenteLeitura = false,
  onConcluido,
}: {
  slug: string
  presente: PresentePublico
  /** Código guardado neste navegador, se foi daqui que o presente foi reservado. */
  codigo: string | null
  somenteLeitura?: boolean
  onConcluido: (mensagem: string) => void
}) {
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<'reservar' | 'comprado' | 'cancelar' | null>(null)

  async function executar(acao: NonNullable<typeof enviando>, chamada: () => Promise<string>) {
    setErro(null)
    setMensagemGeral(null)
    setEnviando(acao)
    try {
      onConcluido(await chamada())
    } catch (e) {
      // 409: alguém reservou antes, ou o organizador desfez a reserva. A lista precisa ser atualizada.
      if (e instanceof ErroApi && e.status === 409 && codigo) esquecerReserva(presente.id)
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
      setEnviando(null)
    }
  }

  function reservar(jaComprado: boolean) {
    if (!nome.trim()) {
      setMensagemGeral('Informe seu nome para o organizador saber quem vai dar o presente.')
      return
    }
    void executar(jaComprado ? 'comprado' : 'reservar', async () => {
      const resposta = await reservarPresente(slug, presente.id, nome, jaComprado)
      guardarReserva(presente.id, resposta.codigoReserva)
      return jaComprado
        ? `Obrigado! "${presente.nome}" foi marcado como comprado.`
        : `"${presente.nome}" está reservado para você. Quando comprar, volte aqui e marque como comprado.`
    })
  }

  const cabecalho = (
    <div className="mb-4">
      {presente.foto && <img src={presente.foto} alt="" className="mb-3 h-40 w-full rounded-[10px] object-cover" />}
      <p className="text-[13px] text-muted">{formatarMoeda(presente.valorEstimado)}</p>
      {presente.descricao && <p className="mt-1 text-[13px] whitespace-pre-line text-heading">{presente.descricao}</p>}
      {presente.linkAfiliado && (
        <a href={presente.linkAfiliado} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-medium text-primary underline">
          Ver na loja
        </a>
      )}
    </div>
  )

  // Presente reservado/comprado por este aparelho
  if (codigo && presente.status !== 'Disponivel') {
    return (
      <div className="flex flex-col gap-3">
        {cabecalho}
        <AvisoErro mensagem={mensagemGeral} />
        {presente.status === 'Comprado' ? (
          <p role="status" className="rounded-[10px] bg-stat-mint px-4 py-3 text-[13px] text-success">
            Você já marcou este presente como comprado. Obrigado!
          </p>
        ) : (
          <>
            <p className="text-[13px] text-heading">Você reservou este presente. Já comprou?</p>
            <Botao
              disabled={somenteLeitura}
              carregando={enviando === 'comprado'}
              onClick={() =>
                void executar('comprado', async () => {
                  await marcarPresenteComprado(slug, presente.id, codigo)
                  return `Obrigado! "${presente.nome}" foi marcado como comprado.`
                })
              }
            >
              Já comprei
            </Botao>
            <Botao
              variante="perigo"
              disabled={somenteLeitura}
              carregando={enviando === 'cancelar'}
              onClick={() =>
                void executar('cancelar', async () => {
                  await cancelarReservaPresente(slug, presente.id, codigo)
                  esquecerReserva(presente.id)
                  return `Reserva de "${presente.nome}" cancelada. Ele voltou para a lista.`
                })
              }
            >
              Cancelar reserva
            </Botao>
          </>
        )}
      </div>
    )
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        reservar(false)
      }}
    >
      {cabecalho}
      <AvisoErro mensagem={mensagemGeral} />
      <CampoTexto
        rotulo="Seu nome"
        placeholder="Para o organizador saber quem vai dar"
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        erro={erro?.doCampo('nome')}
      />
      <p className="text-[12px] text-muted">
        Ao reservar, ninguém mais pode escolher este presente. Depois de comprar, volte aqui neste mesmo aparelho e
        marque como comprado.
      </p>
      <Botao type="submit" disabled={somenteLeitura} carregando={enviando === 'reservar'}>
        Reservar presente
      </Botao>
      <Botao
        type="button"
        variante="secundario"
        disabled={somenteLeitura}
        carregando={enviando === 'comprado'}
        onClick={() => reservar(true)}
      >
        Já comprei este presente
      </Botao>
    </form>
  )
}
