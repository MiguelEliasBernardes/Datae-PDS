import { requisicao } from './cliente'
import type { EnvioAgradecimentos, Recapitulacao, ResumoPosEvento } from './tipos'

/** Pós-evento: resumo da arrecadação, agradecimentos e pré-visualização da recapitulação. */
const base = (eventoId: number) => `/api/eventos/${eventoId}/pos-evento`

export const obterResumoPosEvento = (eventoId: number) => requisicao<ResumoPosEvento>(base(eventoId))

/** Manda o resumo agora para o e-mail de quem está logado (503 se o servidor não tiver e-mail). */
export const enviarResumoPorEmail = (eventoId: number) =>
  requisicao<{ email: string }>(`${base(eventoId)}/resumo/email`, 'POST')

/**
 * Agradecimento por e-mail. Sem `convidadoIds`, vai para todos que têm e-mail e ainda não receberam
 * (ou para todos, com `reenviar`).
 */
export const enviarAgradecimentosEmail = (eventoId: number, convidadoIds?: number[], reenviar?: boolean) =>
  requisicao<EnvioAgradecimentos>(`${base(eventoId)}/agradecimentos/email`, 'POST', { convidadoIds, reenviar })

/** Registra que o organizador abriu o WhatsApp para agradecer o convidado. */
export const registrarWhatsApp = (eventoId: number, convidadoId: number) =>
  requisicao<void>(`${base(eventoId)}/agradecimentos/${convidadoId}/whatsapp`, 'POST')

/** Recapitulação vista de dentro do painel: funciona antes da data do evento também. */
export const obterRecapitulacaoPrevia = (eventoId: number) => requisicao<Recapitulacao>(`${base(eventoId)}/recapitulacao`)
