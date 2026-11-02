/** Tipos mínimos da biblioteca Google Identity Services (https://accounts.google.com/gsi/client). */

interface RespostaCredencialGoogle {
  /** ID token (JWT) assinado pelo Google; o backend valida e cria a sessão. */
  credential: string
}

interface OpcoesBotaoGoogle {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

interface BibliotecaGoogle {
  accounts: {
    id: {
      initialize(opcoes: {
        client_id: string
        callback: (resposta: RespostaCredencialGoogle) => void
        ux_mode?: 'popup' | 'redirect'
        auto_select?: boolean
      }): void
      renderButton(elemento: HTMLElement, opcoes: OpcoesBotaoGoogle): void
    }
  }
}

declare global {
  interface Window {
    google?: BibliotecaGoogle
  }
}

export {}
