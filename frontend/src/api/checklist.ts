import { requisicao } from './cliente'
import type { Checklist, DadosItemChecklist, SugestaoChecklist } from './tipos'

/**
 * Checklist do evento. Na primeira abertura, o backend copia as sugestões do tipo do evento.
 * Todas as alterações devolvem a checklist inteira (com o progresso e as dicas atualizados).
 */
const base = (eventoId: number) => `/api/eventos/${eventoId}/checklist`

export const obterChecklist = (eventoId: number) => requisicao<Checklist>(base(eventoId))

export const criarItemChecklist = (eventoId: number, dados: DadosItemChecklist) =>
  requisicao<Checklist>(`${base(eventoId)}/itens`, 'POST', dados)

export const atualizarItemChecklist = (
  eventoId: number,
  id: number,
  dados: Partial<DadosItemChecklist> & { concluido?: boolean },
) => requisicao<Checklist>(`${base(eventoId)}/itens/${id}`, 'PUT', dados)

export const excluirItemChecklist = (eventoId: number, id: number) =>
  requisicao<Checklist>(`${base(eventoId)}/itens/${id}`, 'DELETE')

/** Cria um presente na lista do evento a partir do item (categoria Itens) e marca o item como feito. */
export const adicionarItemComoPresente = (eventoId: number, id: number) =>
  requisicao<Checklist>(`${base(eventoId)}/itens/${id}/presente`, 'POST')

/** Sugestões do tipo do evento que ainda não estão na checklist (ex.: foram apagadas). */
export const listarSugestoesChecklist = (eventoId: number) =>
  requisicao<SugestaoChecklist[]>(`${base(eventoId)}/sugestoes`)

/** Sem chaves, adiciona todas as sugestões que faltam. */
export const adicionarSugestoesChecklist = (eventoId: number, chaves: string[]) =>
  requisicao<Checklist>(`${base(eventoId)}/sugestoes`, 'POST', { chaves })
