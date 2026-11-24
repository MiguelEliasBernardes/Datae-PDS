import type { CSSProperties } from 'react'

/**
 * Paleta de cores de tema do evento. Os valores são hexadecimais (#RRGGBB)
 * porque é o formato que o backend aceita; são os mesmos do index.css.
 */
export const coresTema = [
  { nome: 'Roxo', valor: '#534ab7' },
  { nome: 'Laranja', valor: '#d85a30' },
  { nome: 'Verde', valor: '#1d9e75' },
  { nome: 'Rosa', valor: '#b5476b' },
  { nome: 'Lilás', valor: '#afa9ec' },
]

/**
 * Variáveis de cor da página de um evento, todas derivadas da cor escolhida nas configurações.
 * O tema padrão tem vários tons de roxo (o principal, um mais escuro para a navegação e os títulos,
 * um bem claro para os fundos das etiquetas); aqui cada um vira o tom equivalente da cor do evento,
 * misturando-a com preto ou branco. Sem cor, a página fica com o roxo padrão.
 */
export function estiloTemaEvento(cor: string | null | undefined): CSSProperties | undefined {
  if (!cor) return undefined
  return {
    '--color-primary': cor,
    '--color-primary-strong': `color-mix(in srgb, ${cor} 72%, black)`,
    '--color-heading': `color-mix(in srgb, ${cor} 45%, black)`,
    '--color-primary-soft': `color-mix(in srgb, ${cor} 45%, white)`,
    '--color-badge': `color-mix(in srgb, ${cor} 12%, white)`,
    '--color-backdrop': `color-mix(in srgb, ${cor} 14%, white)`,
  } as CSSProperties
}
