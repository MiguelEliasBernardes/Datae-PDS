/**
 * Endereço da página pública: /e/{slug}. O prefixo "/e/" evita que um slug
 * colida com outros caminhos do site (ex.: "/api", "/assets").
 */
const PREFIXO_PUBLICO = '/e/'

export const linkPublicoEvento = (slug: string) => `${window.location.origin}${PREFIXO_PUBLICO}${slug}`

/** Slug do evento se a URL atual for de uma página pública, senão null. */
export function slugDaUrl(): string | null {
  const caminho = window.location.pathname
  if (!caminho.startsWith(PREFIXO_PUBLICO)) return null
  const slug = decodeURIComponent(caminho.slice(PREFIXO_PUBLICO.length)).replace(/\/+$/, '')
  return slug || null
}
