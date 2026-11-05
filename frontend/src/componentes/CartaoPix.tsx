import { useState } from 'react'
import setaCheck from '../assets/arrow-check.svg'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import { gerarPix } from '../api/publico'
import type { Pix } from '../api/tipos'
import { formatarMoeda, lerValorMonetario } from '../dados/formatacao'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'

/**
 * Presente em dinheiro via Pix estático: o convidado digita o valor (opcional),
 * recebe o QR Code e o "Pix copia e cola" para pagar no app do banco.
 * Pix estático não tem confirmação automática: o organizador confere no extrato.
 */
export function CartaoPix({ slug, nomeRecebedor }: { slug: string; nomeRecebedor: string | null }) {
  const [valor, setValor] = useState('')
  const [pix, setPix] = useState<Pix | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)

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
      setCopiado(false)
    } catch (e) {
      setErro(e instanceof ErroApi && e.doCampo('valor') ? e.doCampo('valor')! : mensagemDeErro(e))
    } finally {
      setGerando(false)
    }
  }

  async function copiar() {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.copiaECola)
      setCopiado(true)
    } catch {
      setErro('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  return (
    <div className="rounded-[12px] bg-heading p-5 lg:p-7">
      {pix ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[13px] font-medium text-white">
            {pix.valor ? `Pix de ${formatarMoeda(pix.valor)}` : 'Pix sem valor definido'} para {pix.nomeRecebedor}
          </p>
          <img
            src={pix.qrCode}
            alt="QR Code do Pix"
            className="size-52 rounded-[10px] bg-white p-2 [image-rendering:pixelated]"
          />
          <p className="text-[12px] text-theme-lilac">Abra o app do seu banco, escolha Pix e leia o QR Code ou use o copia e cola:</p>
          <textarea
            readOnly
            aria-label="Pix copia e cola"
            value={pix.copiaECola}
            onFocus={(e) => e.target.select()}
            className="h-20 w-full resize-none rounded-[10px] bg-surface p-2 font-mono text-[11px] break-all text-heading"
          />
          <AvisoErro className="w-full" mensagem={erro} />
          <Botao onClick={() => void copiar()}>{copiado ? 'Copiado!' : 'Copiar código Pix'}</Botao>
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
    </div>
  )
}
