import type { CSSProperties } from 'react'

/**
 * Ícone .svg pintado com a cor do texto (`currentColor`), usando o arquivo como máscara.
 * Um `<img>` mostra o .svg com a cor fixa do arquivo; assim o ícone acompanha a cor do tema do evento
 * (ex.: `className="text-heading"`). O .svg não pode ter um retângulo de fundo, senão vira um quadrado.
 */
export function Icone({ src, tamanho = 24, className = '' }: { src: string; tamanho?: number; className?: string }) {
  const mascara = `url("${src}") center / contain no-repeat`
  const estilo: CSSProperties = { width: tamanho, height: tamanho, mask: mascara, WebkitMask: mascara }
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={estilo} />
}
