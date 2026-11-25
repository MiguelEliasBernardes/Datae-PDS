import { requisicao } from './cliente'
import type { RelatorioPix } from './tipos'

/**
 * Relatório dos Pix avisados pelos convidados (Financeiro > Pix), para quem tem a permissão Financeiro.
 * As alterações devolvem o relatório inteiro, com os totais atualizados.
 */
const base = (eventoId: number) => `/api/eventos/${eventoId}/pix-informados`

export const obterRelatorioPix = (eventoId: number) => requisicao<RelatorioPix>(base(eventoId))

/** Marca (ou desmarca) o Pix como conferido no extrato do banco. */
export const marcarPixConferido = (eventoId: number, id: number, conferido: boolean) =>
  requisicao<RelatorioPix>(`${base(eventoId)}/${id}`, 'PUT', { conferido })

/** Exclui um aviso falso ou repetido. */
export const excluirPixInformado = (eventoId: number, id: number) =>
  requisicao<RelatorioPix>(`${base(eventoId)}/${id}`, 'DELETE')
