import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { comprarCotas, informarPix } from '../api/publico'
import type { CompraCotas, Contato, PresentePublico } from '../api/tipos'
import { formatarMoeda } from '../dados/formatacao'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'
import { CamposContato } from './CamposContato'
import { ExibicaoPix } from './ExibicaoPix'

/**
 * Conteúdo da janela de um presente dividido em cotas, na página pública.
 * O convidado escolhe quantas cotas quer dar; se o evento tiver Pix, recebe o QR Code
 * com o valor na hora. `onComprado` avisa a página para atualizar a lista.
 */
export function FormularioCotas({
  slug,
  presente,
  somenteLeitura = false,
  onComprado,
}: {
  slug: string
  presente: PresentePublico
  somenteLeitura?: boolean
  onComprado: () => void
}) {
  const restantes = (presente.quantidadeCotas ?? 0) - presente.cotasVendidas
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState<Contato>({ telefone: '', email: '' })
  const [quantidade, setQuantidade] = useState('1')
  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [compra, setCompra] = useState<CompraCotas | null>(null)
  // "Já fiz o Pix" depois da compra: avisa o organizador (o valor vem da compra)
  const [avisando, setAvisando] = useState(false)
  const [pixAvisado, setPixAvisado] = useState(false)
  const [erroAviso, setErroAviso] = useState<string | null>(null)

  async function avisarPix(cotaId: number) {
    setErroAviso(null)
    setAvisando(true)
    try {
      // O nome precisa ser o mesmo da compra: é assim que o backend confere que a compra é desta pessoa
      await informarPix(slug, { nome, cotaId })
      setPixAvisado(true)
    } catch (e) {
      setErroAviso(mensagemDeErro(e))
    } finally {
      setAvisando(false)
    }
  }

  const numero = Number(quantidade)
  const total = presente.valorCota !== null && Number.isInteger(numero) && numero > 0 ? presente.valorCota * numero : null

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    // Validação no navegador, antes de chamar a API
    if (!nome.trim()) {
      setMensagemGeral('Informe seu nome para o organizador saber quem deu as cotas.')
      return
    }
    if (!Number.isInteger(numero) || numero < 1 || numero > restantes) {
      setMensagemGeral(`Escolha de 1 a ${restantes} ${restantes === 1 ? 'cota' : 'cotas'}.`)
      return
    }

    setMensagemGeral(null)
    setEnviando(true)
    try {
      setCompra(await comprarCotas(slug, presente.id, nome, numero, contato))
      onComprado()
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  const cabecalho = (
    <div className="mb-4">
      {presente.foto && <img src={presente.foto} alt="" className="mb-3 h-40 w-full rounded-[10px] object-cover" />}
      <p className="text-[13px] text-muted">
        {formatarMoeda(presente.valorEstimado)} dividido em {presente.quantidadeCotas} cotas de{' '}
        {formatarMoeda(presente.valorCota)}
      </p>
      <p className="text-[13px] text-muted">
        {restantes > 0 ? `${restantes} de ${presente.quantidadeCotas} cotas ainda disponíveis` : 'Todas as cotas já foram compradas'}
      </p>
      {presente.descricao && <p className="mt-1 text-[13px] whitespace-pre-line text-heading">{presente.descricao}</p>}
      {presente.linkAfiliado && (
        <a href={presente.linkAfiliado} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-medium text-primary underline">
          Ver na loja
        </a>
      )}
    </div>
  )

  if (compra) {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="rounded-[10px] bg-stat-mint px-4 py-3 text-[13px] text-success">
          Obrigado! {compra.quantidade === 1 ? '1 cota registrada' : `${compra.quantidade} cotas registradas`} de "
          {presente.nome}"{compra.valor ? ` (${formatarMoeda(compra.valor)})` : ''}.
        </p>
        {compra.pix ? (
          <div className="flex flex-col gap-3 rounded-[12px] bg-heading p-5">
            <ExibicaoPix pix={compra.pix} />
            {pixAvisado ? (
              <p role="status" className="text-center text-[13px] text-white">
                Avisamos o organizador do seu Pix. Ele vai conferir no extrato do banco.
              </p>
            ) : (
              <>
                <AvisoErro mensagem={erroAviso} />
                <Botao variante="secundario" carregando={avisando} onClick={() => void avisarPix(compra.cotaId)}>
                  Já fiz o Pix
                </Botao>
              </>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-heading">Combine o pagamento diretamente com o organizador.</p>
        )}
      </div>
    )
  }

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={aoEnviar}>
      {cabecalho}
      <AvisoErro mensagem={mensagemGeral} />
      {restantes > 0 && (
        <>
          <CampoTexto
            rotulo="Seu nome"
            placeholder="Para o organizador saber quem deu"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            erro={erro?.doCampo('nome')}
          />
          <CampoTexto
            rotulo="Quantas cotas?"
            type="number"
            min={1}
            max={restantes}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            erro={erro?.doCampo('quantidade')}
          />
          {total !== null && <p className="text-[13px] font-medium text-heading">Total: {formatarMoeda(total)}</p>}
          <CamposContato prefixo="cotas" contato={contato} onAlterar={setContato} erro={erro} />

          <Botao type="submit" disabled={somenteLeitura} carregando={enviando}>
            Dar {numero > 1 ? `${numero} cotas` : 'cota'}
          </Botao>
        </>
      )}
    </form>
  )
}
