import type { ErroApi } from '../api/cliente'
import type { Contato } from '../api/tipos'
import { CampoTexto } from './CampoTexto'

/**
 * Telefone (WhatsApp) e e-mail opcionais nos formulários da página pública (presença, reserva e cotas).
 * O organizador usa esses contatos só para mandar o agradecimento depois do evento.
 */
export function CamposContato({
  contato,
  onAlterar,
  erro,
  prefixo,
}: {
  contato: Contato
  onAlterar: (contato: Contato) => void
  erro: ErroApi | null
  /** Prefixo do name/id dos campos, para não repetir ids na mesma página. */
  prefixo: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CampoTexto
          name={`${prefixo}-telefone`}
          placeholder="WhatsApp (opcional)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={contato.telefone}
          onChange={(e) => onAlterar({ ...contato, telefone: e.target.value })}
          erro={erro?.doCampo('telefone')}
        />
        <CampoTexto
          name={`${prefixo}-email`}
          placeholder="E-mail (opcional)"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={contato.email}
          onChange={(e) => onAlterar({ ...contato, email: e.target.value })}
          erro={erro?.doCampo('email')}
        />
      </div>
      <p className="text-[11px] text-muted">
        Deixe um contato para receber o agradecimento e as fotos depois do evento. Ele fica visível só para o
        organizador.
      </p>
    </div>
  )
}
