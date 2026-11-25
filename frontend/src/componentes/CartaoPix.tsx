import { useCallback, useState } from 'react'
import setaCheck from '../assets/arrow-check.svg'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { gerarPix } from '../api/publico'
import type { Pix } from '../api/tipos'
import { formatarMoeda, lerValorMonetario } from '../dados/formatacao'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'
import { ExibicaoPix } from './ExibicaoPix'
import { FormularioPixInformado } from './FormularioPixInformado'
import { JanelaModal } from './JanelaModal'

/**
 * Presente em dinheiro via Pix estático: o convidado digita o valor (opcional),
 * recebe o QR Code e o "Pix copia e cola" para pagar no app do banco.
 * Depois de pagar, "Já fiz o Pix" avisa o organizador (Financeiro > Pix), que confere no extrato:
 * o Pix estático não tem confirmação automática.
 */
export function CartaoPix({
  slug,
  slugFormando,
  nomeRecebedor,
  somenteLeitura = false,
}: {
  slug: string
  /** Sub-página de um formando: o aviso do Pix diz para qual lista ele foi. */
  slugFormando?: string
  nomeRecebedor: string | null
  /** Pré-visualização do organizador: gera o QR Code, mas não deixa avisar um Pix. */
  somenteLeitura?: boolean
}) {
  const [valor, setValor] = useState('')
  const [pix, setPix] = useState<Pix | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [avisando, setAvisando] = useState(false)
  const [valorInformado, setValorInformado] = useState<number | null>(null)
  const fecharAviso = useCallback(() => setAvisando(false), [])

  async function gerar(e: React.FormEvent) {
    e.preventDefault()
    const numero = lerValorMonetario(valor)

    // Validação no navegador, antes de chamar a API
    if (numero !== null && (Number.isNaN(numero) || numero <= 0)) {
      setErro('Informe um valor válido, ex.: 50 ou 75,50.')
      return
    }

    setErro(null)
    setGerando(true)
    try {
      setPix(await gerarPix(slug, numero))
    } catch (e) {
      setErro(e instanceof ErroApi && e.doCampo('valor') ? e.doCampo('valor')! : mensagemDeErro(e))
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="rounded-[12px] bg-heading p-5 lg:p-7">
      {valorInformado !== null ? (
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <p className="text-[15px] font-bold text-white">Obrigado pelo presente!</p>
          <p className="text-[13px] text-white/85">
            Avisamos o organizador do seu Pix de {formatarMoeda(valorInformado)}. Ele vai conferir no extrato do banco.
          </p>
          <button
            type="button"
            onClick={() => {
              setValorInformado(null)
              setPix(null)
              setValor('')
            }}
            className="text-[13px] font-medium text-white underline"
          >
            Fazer outro Pix
          </button>
        </div>
      ) : pix ? (
        <div className="flex flex-col items-center gap-3">
          {/* key recria a exibição (e o "Copiado!") a cada Pix novo */}
          <ExibicaoPix key={pix.copiaECola} pix={pix} />
          <Botao
            variante="secundario"
            disabled={somenteLeitura}
            onClick={() => setAvisando(true)}
            title={somenteLeitura ? 'Desativado na pré-visualização' : undefined}
          >
            Já fiz o Pix
          </Botao>
          <button type="button" onClick={() => setPix(null)} className="text-[13px] font-medium text-white underline">
            Gerar com outro valor
          </button>
        </div>
      ) : (
        <form onSubmit={gerar} noValidate>
          <p className="text-[13px] font-medium text-white">
            Digite o valor para gerar o QR Code{nomeRecebedor ? ` (Pix para ${nomeRecebedor})` : ''}
          </p>
          <CampoTexto
            className="mt-3"
            name="pix-valor"
            placeholder="R$: 50"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <AvisoErro className="mt-3" mensagem={erro} />
          <Botao
            type="submit"
            className="mt-3"
            carregando={gerando}
            icone={<img src={setaCheck} alt="" width={24} height={24} />}
          >
            Gerar QR Code
          </Botao>
        </form>
      )}

      <JanelaModal titulo="Já fiz o Pix" aberta={avisando} onFechar={fecharAviso}>
        {avisando && pix && (
          <FormularioPixInformado
            slug={slug}
            slugFormando={slugFormando}
            valorInicial={pix.valor}
            onInformado={(valorEnviado) => {
              setAvisando(false)
              setValorInformado(valorEnviado)
            }}
          />
        )}
      </JanelaModal>
    </div>
  )
}
