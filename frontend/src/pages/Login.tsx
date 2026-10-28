import { useState } from 'react'
import arrowRight from '../assets/arrow-big-right.svg'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Logo } from '../components/Logo'

/** Tela O1 - Login do Dataê. */
export function Login({ onLogin }: { onLogin?: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: integrar com a autenticação
    onLogin?.()
  }

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
            <p className="mt-1 text-[13px] text-muted">
              Entre para organizar seu evento
            </p>
          </header>

          {/* Título (desktop) */}
          <div className="hidden lg:block">
            <h1 className="text-[28px] font-bold text-heading">
              Entrar
            </h1>
            <p className="mt-1 text-[14px] text-muted">
              Entre para organizar seu evento
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5 lg:mt-8">
        <Input
          label="E-mail"
          type="email"
          placeholder="seuemail@exemplo.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <Input
            label="Senha"
            type="password"
            placeholder="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <a
            href="#"
            className="self-end text-[12px] font-medium text-primary"
          >
            Esqueci minha senha
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          icon={<img src={arrowRight} alt="" width={24} height={24} />}
        >
          Entrar
        </Button>

        {/* Divisor "ou" */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-field-border" />
          <span className="text-[12px] text-placeholder">ou</span>
          <span className="h-px flex-1 bg-field-border" />
        </div>

            <Button type="button" variant="secondary">
              Entrar com Google
            </Button>
          </form>

          {/* Rodapé */}
          <p className="pt-10 text-center text-[13px] font-medium text-primary">
            <a href="#">Não tem conta? Criar conta</a>
          </p>
        </div>
      </div>
    </div>
  )
}
