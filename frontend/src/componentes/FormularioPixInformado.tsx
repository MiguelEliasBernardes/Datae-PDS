import { useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { informarPix } from '../api/publico'
import type { Contato } from '../api/tipos'
import { lerValorMonetario } from '../dados/formatacao'
import { AreaTexto } from './AreaTexto'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'
import { CamposContato } from './CamposContato'

/**
 * "Já fiz o Pix" do presente em dinheiro: o convidado informa o nome, o valor que mandou e um recado.
 * O aviso vai para o relatório do organizador (Financeiro > Pix), que confere no extrato do banco.
 * Os contatos opcionais servem para o agradecimento do pós-evento.
 */
export function FormularioPixInformado({
  slug,
  slugFormando,
  valorInicial,
  onInformado,
}: {
  slug: string
  slugFormando?: string
  /** Valor do QR Code gerado (null = o convidado digitou o valor no app do banco). */
  valorInicial: number | null
  onInformado: (valor: number) => void
}) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState(valorInicial !== null ? String(valorInicial).replace('.', ',') : '')
  const [recado, setRecado] = useState('')
  const [contato, setContato] = useState<Contato>({ telefone: '', email: '' })
  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    const numero = lerValorMonetario(valor)

    // Validação no navegador, antes de chamar a API
    if (!nome.trim()) return setMensagem('Informe seu nome para o organizador saber quem mandou o Pix.')
    if (numero === null || Number.isNaN(numero) || numero <= 0)
      return setMensagem('Informe o valor que você mandou, ex.: 50 ou 75,50.')

    setMensagem(null)
    setEnviando(true)
    try {
      const resposta = await informarPix(slug, {
        nome,
        valor: numero,
        recado: recado.trim() || undefined,
        slugFormando,
        ...contato,
      })
      onInformado(resposta.valor)
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagem(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={aoEnviar}>
      <p className="text-[13px] text-muted">
        Avise o organizador do Pix que você fez. Ele vai conferir no extrato do banco.
      </p>
      <CampoTexto
        rotulo="Seu nome"
        name="pix-nome"
        autoComplete="name"
        placeholder="Para o organizador saber quem mandou"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        erro={erro?.doCampo('nome')}
      />
      <CampoTexto
        rotulo="Valor enviado (R$)"
        name="pix-valor-enviado"
        inputMode="decimal"
        placeholder="Ex.: 100"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        erro={erro?.doCampo('valor')}
      />
      <AreaTexto
        rotulo="Recado (opcional)"
        name="pix-recado"
        maxLength={500}
        placeholder="Deixe uma mensagem para quem vai receber"
        value={recado}
        onChange={(e) => setRecado(e.target.value)}
        erro={erro?.doCampo('recado')}
      />
      <CamposContato prefixo="pix" contato={contato} onAlterar={setContato} erro={erro} />
      <AvisoErro mensagem={mensagem} />
      <Botao type="submit" carregando={enviando}>
        Avisar o organizador
      </Botao>
    </form>
  )
}
