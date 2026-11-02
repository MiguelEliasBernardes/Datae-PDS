import { useState } from 'react'
import setaDireita from '../assets/arrow-big-right.svg'
import { cadastrar, entrar } from '../api/autenticacao'
import { ErroApi, mensagemDeErro } from '../api/cliente'
import type { Usuario } from '../api/tipos'
import { AvisoErro } from '../componentes/AvisoErro'
import { Botao } from '../componentes/Botao'
import { CampoTexto } from '../componentes/CampoTexto'
import { Logo } from '../componentes/Logo'

type Modo = 'entrar' | 'cadastrar'

/** Tela O1 - Login do Dataê (também usada para criar conta). */
export function Login({ onEntrar }: { onEntrar: (usuario: Usuario) => void }) {
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const [erro, setErro] = useState<ErroApi | null>(null)
  const [mensagemGeral, setMensagemGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cadastrando = modo === 'cadastrar'

  function trocarModo() {
    setModo(cadastrando ? 'entrar' : 'cadastrar')
    setErro(null)
    setMensagemGeral(null)
  }

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    // Validação no navegador, antes de chamar a API
    if ((cadastrando && !nome.trim()) || !email.trim() || !senha) {
      setMensagemGeral(cadastrando ? 'Preencha nome, e-mail e senha.' : 'Informe e-mail e senha.')
      return
    }

    setMensagemGeral(null)
    setEnviando(true)
    try {
      const usuario = cadastrando ? await cadastrar(nome, email, senha) : await entrar(email, senha)
      onEntrar(usuario)
    } catch (e) {
      if (e instanceof ErroApi) setErro(e)
      setMensagemGeral(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  const subtitulo = cadastrando ? 'Crie sua conta para organizar seu evento' : 'Entre para organizar seu evento'

  return (
    <div className="flex min-h-screen w-full">
      {/* Painel de marca (desktop) */}
      <aside className="hidden w-1/2 flex-col justify-center gap-6 bg-primary-strong px-16 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-heading text-[40px] font-bold">Dataê</span>
        </div>
        <p className="max-w-sm text-[18px] leading-relaxed text-white/80">
          Organize seu evento num lugar só — convidados, presentes, mural de
          fotos e muito mais.
        </p>
      </aside>

      {/* Coluna do formulário */}
      <div className="flex min-h-screen w-full flex-col justify-center bg-surface px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto flex w-full max-w-[390px] flex-col">
          {/* Cabeçalho */}
          <header className="flex flex-col items-center text-center lg:hidden">
            <Logo />
            <h1 className="mt-4 text-[28px] font-bold text-heading">Dataê</h1>
            <p className="mt-1 text-[13px] text-muted">{subtitulo}</p>
          </header>

          {/* Título (desktop) */}
          <div className="hidden lg:block">
            <h1 className="text-[28px] font-bold text-heading">
              {cadastrando ? 'Criar conta' : 'Entrar'}
            </h1>
            <p className="mt-1 text-[14px] text-muted">{subtitulo}</p>
          </div>

          {/* Formulário */}
          <form onSubmit={aoEnviar} noValidate className="mt-10 flex flex-col gap-5 lg:mt-8">
            <AvisoErro mensagem={mensagemGeral} />

            {cadastrando && (
              <CampoTexto
                rotulo="Nome"
                placeholder="Seu nome"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                erro={erro?.doCampo('nome')}
              />
            )}

            <CampoTexto
              rotulo="E-mail"
              type="email"
              placeholder="seuemail@exemplo.com.br"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erro={erro?.doCampo('email')}
            />

            <div className="flex flex-col gap-2">
              <CampoTexto
                rotulo="Senha"
                type="password"
                placeholder={cadastrando ? 'mínimo de 6 caracteres' : 'senha'}
                autoComplete={cadastrando ? 'new-password' : 'current-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                erro={erro?.doCampo('senha')}
              />
              {!cadastrando && (
                <a href="#" className="self-end text-[12px] font-medium text-primary">
                  Esqueci minha senha
                </a>
              )}
            </div>

            <Botao
              type="submit"
              variante="principal"
              carregando={enviando}
              icone={<img src={setaDireita} alt="" width={24} height={24} />}
            >
              {cadastrando ? 'Criar conta' : 'Entrar'}
            </Botao>

            {/* Divisor "ou" */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-field-border" />
              <span className="text-[12px] text-placeholder">ou</span>
              <span className="h-px flex-1 bg-field-border" />
            </div>

            <Botao type="button" variante="secundario">
              Entrar com Google
            </Botao>
          </form>

          {/* Rodapé */}
          <p className="pt-10 text-center text-[13px] font-medium text-primary">
            <button type="button" onClick={trocarModo}>
              {cadastrando ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
