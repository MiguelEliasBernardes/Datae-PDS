import { requisicao } from './cliente'
import { limparSessao, salvarSessao } from './sessao'
import type { RespostaLogin } from './tipos'

export async function entrar(email: string, senha: string) {
  const resposta = await requisicao<RespostaLogin>('/api/autenticacao/login', 'POST', { email, senha })
  salvarSessao(resposta)
  return resposta.usuario
}

export async function cadastrar(nome: string, email: string, senha: string) {
  const resposta = await requisicao<RespostaLogin>('/api/autenticacao/cadastro', 'POST', { nome, email, senha })
  salvarSessao(resposta)
  return resposta.usuario
}

export function sair() {
  limparSessao()
}
