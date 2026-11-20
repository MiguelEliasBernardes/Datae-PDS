import type { Agradecimento } from '../api/tipos'
import { formatarTelefone } from '../dados/formatacao'
import { Botao } from './Botao'
import { SeloStatus } from './SeloStatus'

/**
 * Convidado a quem agradecer no pós-evento: por que (presença, presentes, cotas), os contatos
 * e os botões de WhatsApp (abre o wa.me com a mensagem pronta) e de e-mail.
 */
export function LinhaAgradecimento({
  agradecimento: a,
  emailDisponivel,
  enviandoEmail,
  onAbrirWhatsApp,
  onEnviarEmail,
}: {
  agradecimento: Agradecimento
  emailDisponivel: boolean
  enviandoEmail: boolean
  onAbrirWhatsApp: () => void
  onEnviarEmail: () => void
}) {
  const semContato = !a.telefone && !a.email

  return (
    <li className="flex flex-col gap-3 rounded-[12px] border-[1.5px] border-field-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-[14px] font-semibold text-heading">{a.nome}</p>
          <p className="mt-0.5 text-[12px] text-muted">{a.motivos.join(' · ')}</p>
          {(a.telefone || a.email) && (
            <p className="mt-0.5 text-[12px] break-all text-muted">
              {[formatarTelefone(a.telefone), a.email].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {a.whatsAppAbertoEm && <SeloStatus tom="sucesso">WhatsApp aberto</SeloStatus>}
          {a.emailEnviadoEm && <SeloStatus tom="sucesso">E-mail enviado</SeloStatus>}
          {semContato && <SeloStatus tom="neutro">Sem contato</SeloStatus>}
        </div>
      </div>

      <details className="text-[12px] text-muted">
        <summary className="cursor-pointer font-medium text-primary">Ver mensagem</summary>
        <p className="mt-2 rounded-[10px] bg-badge p-3 whitespace-pre-line text-heading">{a.mensagem}</p>
      </details>

      {!semContato && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {a.linkWhatsApp && (
            <a
              href={a.linkWhatsApp}
              target="_blank"
              rel="noreferrer"
              onClick={onAbrirWhatsApp}
              className="flex h-9 items-center justify-center rounded-[9px] bg-success px-3 text-[13px] font-medium text-white hover:opacity-90"
            >
              {a.whatsAppAbertoEm ? 'Abrir WhatsApp de novo' : 'Agradecer no WhatsApp'}
            </a>
          )}
          {a.email && (
            <Botao
              tamanho="pequeno"
              variante="secundario"
              disabled={!emailDisponivel}
              carregando={enviandoEmail}
              onClick={onEnviarEmail}
              title={emailDisponivel ? undefined : 'O envio de e-mail não está configurado no servidor.'}
            >
              {a.emailEnviadoEm ? 'Reenviar e-mail' : 'Enviar e-mail'}
            </Botao>
          )}
        </div>
      )}
    </li>
  )
}
