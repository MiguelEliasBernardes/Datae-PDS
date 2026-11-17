/**
 * Endereços que o frontend entende sem roteador:
 * - /e/{slug}: página pública do evento; /e/{slug}/{formando}: sub-página de um formando.
 *   O prefixo "/e/" evita que um slug colida com outros caminhos do site (ex.: "/api", "/assets").
 * - /convite/{codigo}: convite para entrar na comissão de uma formatura.
 */
const PREFIXO_PUBLICO = '/e/'
const PREFIXO_CONVITE = '/convite/'

export const linkPublicoEvento = (slug: string) => `${window.location.origin}${PREFIXO_PUBLICO}${slug}`

export const linkPaginaFormando = (slug: string, slugFormando: string) =>
  `${linkPublicoEvento(slug)}/${slugFormando}`

export const linkConvite = (codigo: string) => `${window.location.origin}${PREFIXO_CONVITE}${codigo}`

/** Partes do caminho depois do prefixo, já decodificadas e sem barras sobrando. */
function partesDaUrl(prefixo: string): string[] | null {
  const caminho = window.location.pathname
  if (!caminho.startsWith(prefixo)) return null
  return caminho
    .slice(prefixo.length)
    .split('/')
    .filter(Boolean)
    .map((parte) => decodeURIComponent(parte))
}

/** Se a URL atual for de uma página pública: o slug do evento e, na sub-página, o do formando. */
export function rotaPublicaDaUrl(): { slug: string; slugFormando: string | null } | null {
  const partes = partesDaUrl(PREFIXO_PUBLICO)
  if (!partes?.length) return null
  return { slug: partes[0], slugFormando: partes[1] ?? null }
}

/** Código do convite se a URL atual for /convite/{codigo}, senão null. */
export function codigoConviteDaUrl(): string | null {
  return partesDaUrl(PREFIXO_CONVITE)?.[0] ?? null
}

/** Volta a URL para a raiz sem recarregar (ex.: depois de aceitar o convite). */
export function limparUrl() {
  window.history.replaceState(null, '', '/')
}
