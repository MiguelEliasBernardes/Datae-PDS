import type { RespostaLogin, Usuario } from './tipos'

const CHAVE_TOKEN = 'datae.token'
const CHAVE_USUARIO = 'datae.usuario'
const CHAVE_EXPIRACAO = 'datae.expiraEm'

/** Guarda o token no navegador para manter o usuário logado entre recarregamentos. */
export function salvarSessao({ token, expiraEm, usuario }: RespostaLogin) {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_EXPIRACAO, expiraEm)
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_EXPIRACAO)
  localStorage.removeItem(CHAVE_USUARIO)
}

/** Token atual, ou null se não houver sessão ou se ela já expirou. */
export function obterToken(): string | null {
  const token = localStorage.getItem(CHAVE_TOKEN)
  const expiraEm = localStorage.getItem(CHAVE_EXPIRACAO)

  if (!token) return null
  if (expiraEm && new Date(expiraEm) <= new Date()) {
    limparSessao()
    return null
  }
  return token
}

export function obterUsuario(): Usuario | null {
  if (!obterToken()) return null
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO) ?? 'null') as Usuario | null
  } catch {
    return null
  }
}
