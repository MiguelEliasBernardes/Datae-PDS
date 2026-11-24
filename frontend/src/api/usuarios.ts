import { requisicao } from './cliente'
import { salvarUsuario } from './sessao'
import type { DadosConta, Usuario } from './tipos'

/** Dados da conta logada (direto do servidor, para saber, por exemplo, se ela já tem senha). */
export const obterMinhaConta = () => requisicao<Usuario>('/api/usuarios/eu')

/** Altera nome, e-mail e/ou senha; campos ausentes não mudam. Atualiza o usuário guardado na sessão. */
export async function atualizarMinhaConta(dados: DadosConta) {
  const usuario = await requisicao<Usuario>('/api/usuarios/eu', 'PUT', dados)
  salvarUsuario(usuario)
  return usuario
}
