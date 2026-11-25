import { requisicao } from './cliente'
import type { Organizacao } from './tipos'

/**
 * Organização de um evento que não é formatura: o código de convite e os co-organizadores.
 * Quem participa vê; só o dono troca o código e remove pessoas. As alterações devolvem a organização inteira.
 */
const base = (eventoId: number) => `/api/eventos/${eventoId}/organizacao`

export const obterOrganizacao = (eventoId: number) => requisicao<Organizacao>(base(eventoId))

/** Liga (ou troca) o código de convite; o anterior deixa de valer. */
export const gerarCodigoOrganizacao = (eventoId: number) => requisicao<Organizacao>(`${base(eventoId)}/codigo`, 'POST')

export const desativarCodigoOrganizacao = (eventoId: number) =>
  requisicao<Organizacao>(`${base(eventoId)}/codigo`, 'DELETE')

export const removerCoOrganizador = (eventoId: number, id: number) =>
  requisicao<Organizacao>(`${base(eventoId)}/membros/${id}`, 'DELETE')

/** O co-organizador sai da organização (o evento some de "Meus Eventos" dele). */
export const sairDaOrganizacao = (eventoId: number) => requisicao<void>(`${base(eventoId)}/eu`, 'DELETE')
