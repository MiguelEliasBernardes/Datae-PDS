import { useEffect, useRef, useState } from 'react'
import { carregarScriptGoogle, clientIdGoogle } from '../dados/google'
import { Botao } from './Botao'

/**
 * Botão oficial "Continuar com o Google". Ao concluir, entrega a credencial
 * (ID token) para quem chamou enviar ao backend.
 */
export function BotaoGoogle({
  onCredencial,
  onErro,
  desabilitado = false,
}: {
  onCredencial: (credencial: string) => void
  onErro: (mensagem: string) => void
  desabilitado?: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const [pronto, setPronto] = useState(false)

  // Guarda os callbacks mais recentes sem precisar recriar o botão do Google a cada render
  const callbacks = useRef({ onCredencial, onErro })
  useEffect(() => {
    callbacks.current = { onCredencial, onErro }
  })

  useEffect(() => {
    if (!clientIdGoogle) return
    let ativo = true

    carregarScriptGoogle()
      .then(() => {
        const google = window.google
        if (!ativo || !google || !container.current) return

        google.accounts.id.initialize({
          client_id: clientIdGoogle,
          callback: (resposta) => callbacks.current.onCredencial(resposta.credential),
        })
        google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          locale: 'pt-BR',
          // O Google aceita no máximo 400px de largura
          width: Math.min(400, container.current.offsetWidth || 390),
        })
        setPronto(true)
      })
      .catch((e: Error) => {
        if (ativo) callbacks.current.onErro(e.message)
      })

    return () => {
      ativo = false
    }
  }, [])

  // Sem Client ID configurado, mostra o botão desabilitado com a explicação
  if (!clientIdGoogle) {
    return (
      <Botao type="button" variante="secundario" disabled title="Defina VITE_GOOGLE_CLIENT_ID no frontend/.env.local">
        Entrar com Google (não configurado)
      </Botao>
    )
  }

  return (
    <div
      className={`flex min-h-12 w-full justify-center ${desabilitado ? 'pointer-events-none opacity-60' : ''}`}
      aria-busy={!pronto}
    >
      <div ref={container} className="w-full" />
    </div>
  )
}
