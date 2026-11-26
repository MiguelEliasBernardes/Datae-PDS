import type { CSSProperties } from 'react'
import presente from '../assets/gift.svg'
import { Icone } from './Icone'

/**
 * Fundo no lugar de uma imagem que não foi enviada (banner do evento ou foto do presente):
 * um degradê na cor do evento, do tom mais claro para o mais escuro.
 * Sem `cor`, usa a cor principal do tema da página (`--color-primary`), que na página pública já é a do evento.
 * Com `icone`, mostra um presente branco no centro (presentes sem foto).
 */
export function FundoCorEvento({
  cor,
  icone = false,
  tamanhoIcone = 28,
  className = '',
}: {
  cor?: string | null
  icone?: boolean
  tamanhoIcone?: number
  className?: string
}) {
  const base = cor || 'var(--color-primary)'
  const estilo: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${base} 55%, white), ${base} 55%, color-mix(in srgb, ${base} 65%, black))`,
  }
  return (
    <div aria-hidden="true" className={`flex items-center justify-center ${className}`} style={estilo}>
      {icone && <Icone src={presente} tamanho={tamanhoIcone} className="text-white/90" />}
    </div>
  )
}
