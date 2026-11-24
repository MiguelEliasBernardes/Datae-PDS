import { useCallback, useState } from 'react'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import type { DadosConta, Usuario } from '../api/tipos'
import { atualizarMinhaConta, obterMinhaConta } from '../api/usuarios'
import { useCarregamento } from '../hooks/useCarregamento'
import { AvisoErro } from './AvisoErro'
import { Botao } from './Botao'
import { CampoTexto } from './CampoTexto'
import { MensagemLista } from './MensagemLista'

const TAMANHO_MINIMO_SENHA = 6

/**
 * "Minha conta": nome, e-mail e senha do usuário logado. Os dados vêm do servidor ao abrir
 * (para saber se a conta já tem senha: as criadas pelo Google podem não ter).
 * Só os campos alterados são enviados; trocar o e-mail ou a senha pede a senha atual.
 */
export function FormularioConta({ onSalvo }: { onSalvo: (usuario: Usuario) => void }) {
  const carregar = useCallback(() => obterMinhaConta(), [])
  const { dados, erro: erroCarregar, carregando, recarregar } = useCarregamento(carregar)
  // Depois de salvar, a comparação ("o e-mail mudou?") passa a ser com os dados novos
  const [salvo, setSalvo] = useState<Usuario | null>(null)
  const conta = salvo ?? dados

  if (!conta) {
    return (
      <>
        <AvisoErro mensagem={erroCarregar} onTentarNovamente={recarregar} />
        {carregando && <MensagemLista>Carregando...</MensagemLista>}
      </>
    )
  }

  return (
    <Campos
      conta={conta}
      onSalvo={(usuario) => {
        setSalvo(usuario)
        onSalvo(usuario)
      }}
    />
  )
}

function Campos({ conta, onSalvo }: { conta: Usuario; onSalvo: (usuario: Usuario) => void }) {
  const [nome, setNome] = useState(conta.nome)
  const [email, setEmail] = useState(conta.email)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const emailMudou = email.trim().toLowerCase() !== conta.email.toLowerCase()
  const precisaSenhaAtual = conta.temSenha && (emailMudou || novaSenha !== '')

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    setSucesso(null)

    // Validação no navegador, antes de chamar a API
    if (!nome.trim()) return setMensagem('Informe o seu nome.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMensagem('Informe um e-mail válido.')
    if (novaSenha && novaSenha.length < TAMANHO_MINIMO_SENHA)
      return setMensagem(`A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`)
    if (novaSenha !== confirmacao) return setMensagem('A confirmação não é igual à nova senha.')
    if (precisaSenhaAtual && !senhaAtual) return setMensagem('Informe a senha atual para trocar o e-mail ou a senha.')

    const dados: DadosConta = {}
    if (nome.trim() !== conta.nome) dados.nome = nome.trim()
    if (emailMudou) dados.email = email.trim()
    if (novaSenha) dados.novaSenha = novaSenha
    if (senhaAtual && (dados.email || dados.novaSenha)) dados.senhaAtual = senhaAtual
    if (Object.keys(dados).length === 0) return setMensagem('Nada foi alterado.')

    setSalvando(true)
    try {
      const usuario = await atualizarMinhaConta(dados)
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmacao('')
      setSucesso(dados.novaSenha ? 'Dados e senha atualizados.' : 'Dados atualizados.')
      onSalvo(usuario)
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagem(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4" noValidate>
      <CampoTexto
        rotulo="Nome"
        name="nome"
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        erro={erro?.doCampo('nome')}
      />
      <CampoTexto
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        erro={erro?.doCampo('email')}
      />

      <div className="flex flex-col gap-3 border-t border-field-border pt-4">
        <p className="text-[12px] text-muted">
          {conta.temSenha
            ? 'Para trocar a senha, preencha os campos abaixo. Deixe em branco para manter a atual.'
            : 'Você entra com o Google. Se quiser, crie uma senha para entrar também com o e-mail.'}
        </p>
        <CampoTexto
          rotulo={conta.temSenha ? 'Nova senha' : 'Criar senha'}
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          placeholder={`mínimo de ${TAMANHO_MINIMO_SENHA} caracteres`}
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          erro={erro?.doCampo('novaSenha')}
        />
        <CampoTexto
          rotulo="Confirmar a senha"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
      </div>

      {precisaSenhaAtual && (
        <CampoTexto
          rotulo="Senha atual"
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          placeholder="Para confirmar que é você"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          erro={erro?.doCampo('senhaAtual')}
        />
      )}

      <AvisoErro mensagem={mensagem} />
      {sucesso && <p className="text-[13px] font-medium text-success">{sucesso}</p>}
      <Botao type="submit" carregando={salvando}>
        Salvar alterações
      </Botao>
    </form>
  )
}
