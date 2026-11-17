import { requisicao } from './cliente'
import type { CotaPresente, DadosPresente, Presente } from './tipos'

/**
 * Duas listas com as mesmas operações: a do evento e, com `minhaLista`, a lista pessoal
 * do formando logado (que aparece na sub-página dele).
 */
const base = (eventoId: number, minhaLista = false) =>
  `/api/eventos/${eventoId}/${minhaLista ? 'meus-presentes' : 'presentes'}`

export const listarPresentes = (eventoId: number, minhaLista = false) =>
  requisicao<Presente[]>(base(eventoId, minhaLista))

export const criarPresente = (eventoId: number, dados: DadosPresente, minhaLista = false) =>
  requisicao<Presente>(base(eventoId, minhaLista), 'POST', dados)

export const atualizarPresente = (eventoId: number, id: number, dados: Partial<DadosPresente>, minhaLista = false) =>
  requisicao<Presente>(`${base(eventoId, minhaLista)}/${id}`, 'PUT', dados)

export const excluirPresente = (eventoId: number, id: number, minhaLista = false) =>
  requisicao<void>(`${base(eventoId, minhaLista)}/${id}`, 'DELETE')

export const listarCotas = (eventoId: number, id: number, minhaLista = false) =>
  requisicao<CotaPresente[]>(`${base(eventoId, minhaLista)}/${id}/cotas`)

/** Desfaz uma compra de cotas (ex.: o convidado não pagou); devolve o presente atualizado. */
export const excluirCota = (eventoId: number, id: number, cotaId: number, minhaLista = false) =>
  requisicao<Presente>(`${base(eventoId, minhaLista)}/${id}/cotas/${cotaId}`, 'DELETE')
