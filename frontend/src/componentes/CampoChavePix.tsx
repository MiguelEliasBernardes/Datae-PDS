import { useState } from 'react'
import {
  detectarTipoChave,
  formatarChavePix,
  opcoesTipoChavePix,
  tipoChaveNumerico,
  type TipoChavePix,
} from '../dados/chavePix'
import { classeBorda, tonsRotulo } from '../dados/estilosCampo'
import { ErroCampo } from './ErroCampo'

/**
 * Campo da chave Pix com o seletor do tipo. O texto é formatado conforme o tipo enquanto a pessoa digita.
 * Ao colar uma chave (ou digitar uma letra num tipo só de números), o tipo é adivinhado pela chave.
 */
export function CampoChavePix({
  valor,
  tipo,
  onAlterar,
  erro,
  className = '',
}: {
  valor: string
  tipo: TipoChavePix
  onAlterar: (valor: string, tipo: TipoChavePix) => void
  erro?: string
  className?: string
}) {
  // Depois que a pessoa escolhe o tipo no seletor, o palpite não troca mais entre e-mail e aleatória
  const [tipoEscolhido, setTipoEscolhido] = useState(false)
  const opcao = opcoesTipoChavePix.find((o) => o.valor === tipo) ?? opcoesTipoChavePix[0]

  function digitar(texto: string) {
    if (!texto.trim()) {
      setTipoEscolhido(false)
      onAlterar('', tipo)
      return
    }

    const colou = texto.length - valor.length > 1
    let novoTipo = tipo
    if (colou || (tipoChaveNumerico(tipo) && /[a-z@]/i.test(texto))) novoTipo = detectarTipoChave(texto)
    else if (!tipoChaveNumerico(tipo) && !tipoEscolhido)
      novoTipo = !texto.includes('@') && /^[0-9a-f-]+$/i.test(texto) ? 'aleatoria' : 'email'

    if (novoTipo !== tipo) setTipoEscolhido(false)
    onAlterar(formatarChavePix(novoTipo, texto), novoTipo)
  }

  function escolherTipo(novoTipo: TipoChavePix) {
    setTipoEscolhido(true)
    onAlterar(formatarChavePix(novoTipo, valor), novoTipo)
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor="chave-pix" className={tonsRotulo.campo}>
        Chave Pix
      </label>
      <div className="flex gap-2">
        <select
          aria-label="Tipo da chave Pix"
          value={tipo}
          onChange={(e) => escolherTipo(e.target.value as TipoChavePix)}
          className={`h-[46px] w-[120px] shrink-0 rounded-[10px] border-[1.5px] bg-surface px-2 text-[12px] text-heading outline-none transition-colors ${classeBorda(erro)}`}
        >
          {opcoesTipoChavePix.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <input
          id="chave-pix"
          inputMode={opcao.modoTeclado}
          autoComplete="off"
          placeholder={opcao.placeholder}
          value={valor}
          onChange={(e) => digitar(e.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? 'chave-pix-erro' : undefined}
          className={`h-[46px] min-w-0 flex-1 rounded-[10px] border-[1.5px] bg-surface px-3 text-[12px] text-heading outline-none transition-colors placeholder:text-placeholder ${classeBorda(erro)}`}
        />
      </div>
      <ErroCampo id="chave-pix" erro={erro} />
    </div>
  )
}
