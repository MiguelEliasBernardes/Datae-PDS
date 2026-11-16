import { useState } from 'react'
import type { Pix } from '../api/tipos'
import { formatarMoeda } from '../dados/formatacao'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'

/** QR Code e "Pix copia e cola" já gerados, com o botão de copiar (fundo escuro). */
export function ExibicaoPix({ pix }: { pix: Pix }) {
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.copiaECola)
      setCopiado(true)
    } catch {
      setErro('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  return (
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
    </div>
  )
}
