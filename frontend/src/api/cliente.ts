import { limparSessao, obterToken } from './sessao'

/**
 * Endereço da API. Em desenvolvimento fica vazio: o Vite repassa "/api" para
 * o backend (ver vite.config.ts). Em produção, defina VITE_API_URL.
 */
const URL_API = import.meta.env.VITE_API_URL ?? ''

/** Erros de validação por campo, ex.: { email: ['Informe um e-mail válido.'] }. */
export type ErrosCampos = Record<string, string[]>

/** Erro padronizado de qualquer chamada à API. */
export class ErroApi extends Error {
  /** Status HTTP (0 quando o servidor nem respondeu). */
  status: number
  errosCampos: ErrosCampos

  constructor(mensagem: string, status: number, errosCampos: ErrosCampos = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.errosCampos = errosCampos
  }

  /** Primeira mensagem de erro de um campo, para mostrar abaixo do input. */
  doCampo(campo: string): string | undefined {
    return this.errosCampos[campo]?.[0]
  }
}

let aoExpirarSessao: (() => void) | null = null

/** O App registra aqui o que fazer quando o token expirar (voltar para o login). */
export function definirAoExpirarSessao(callback: (() => void) | null) {
  aoExpirarSessao = callback
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE'

export async function requisicao<T>(caminho: string, metodo: Metodo = 'GET', corpo?: unknown): Promise<T> {
  const token = obterToken()
  const cabecalhos: Record<string, string> = {}
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
  if (token) cabecalhos['Authorization'] = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 0)
  }

  if (resposta.ok) {
    if (resposta.status === 204) return undefined as T
    return (await resposta.json()) as T
  }

  const dados = await lerCorpoErro(resposta)

  // Token inválido ou expirado: encerra a sessão e volta para o login
  if (resposta.status === 401 && token) {
    limparSessao()
    aoExpirarSessao?.()
    throw new ErroApi('Sua sessão expirou. Entre novamente.', 401)
  }

  throw new ErroApi(mensagemDoErro(resposta.status, dados), resposta.status, dados?.errors ?? {})
}

interface CorpoErro {
  mensagem?: string
  title?: string
  errors?: ErrosCampos
}

async function lerCorpoErro(resposta: Response): Promise<CorpoErro | null> {
  try {
    return (await resposta.json()) as CorpoErro
  } catch {
    return null
  }
}

function mensagemDoErro(status: number, dados: CorpoErro | null): string {
  if (dados?.mensagem) return dados.mensagem
  if (dados?.errors) return 'Verifique os campos destacados.'

  switch (status) {
    case 400:
      return 'Dados inválidos. Confira as informações enviadas.'
    case 403:
      return 'Você não tem permissão para isso.'
    case 404:
      return 'Não encontrado.'
    case 409:
      return 'Esse registro entra em conflito com outro já existente.'
    default:
      return status >= 500
        ? 'Erro no servidor. Tente novamente em instantes.'
        : 'Algo deu errado. Tente novamente.'
  }
}

/** Converte qualquer erro em texto para exibir na tela. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message
  return 'Algo deu errado. Tente novamente.'
}
