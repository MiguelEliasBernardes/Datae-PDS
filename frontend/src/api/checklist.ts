import { requisicao } from './cliente'
import type { Checklist, DadosItemChecklist } from './tipos'

/**
 * Checklist do evento. Ela começa vazia: os itens são criados à mão ou pelo Roteiro com IA.
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
