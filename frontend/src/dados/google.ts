/** Client ID do Google (Google Cloud Console → Credenciais). Vazio = login com Google desligado. */
export const clientIdGoogle: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const URL_SCRIPT = 'https://accounts.google.com/gsi/client'

let carregamento: Promise<void> | null = null

/** Carrega o script do Google Identity Services uma única vez, mesmo com várias telas pedindo. */
export function carregarScriptGoogle(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()

  carregamento ??= new Promise<void>((resolver, rejeitar) => {
    const script = document.createElement('script')
    script.src = URL_SCRIPT
    script.async = true
    script.onload = () => resolver()
    script.onerror = () => {
      carregamento = null // permite tentar de novo
      script.remove()
      rejeitar(new Error('Não foi possível carregar o login com Google. Verifique sua conexão.'))
    }
    document.head.appendChild(script)
  })

  return carregamento
}
