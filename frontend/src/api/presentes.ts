import { requisicao } from './cliente'
import type { CotaPresente, DadosPresente, Presente } from './tipos'

const base = (eventoId: number) => `/api/eventos/${eventoId}/presentes`

export const listarPresentes = (eventoId: number) => requisicao<Presente[]>(base(eventoId))

export const criarPresente = (eventoId: number, dados: DadosPresente) =>
  requisicao<Presente>(base(eventoId), 'POST', dados)

export const atualizarPresente = (eventoId: number, id: number, dados: Partial<DadosPresente>) =>
  requisicao<Presente>(`${base(eventoId)}/${id}`, 'PUT', dados)

export const excluirPresente = (eventoId: number, id: number) =>
  requisicao<void>(`${base(eventoId)}/${id}`, 'DELETE')

export const listarCotas = (eventoId: number, id: number) =>
  requisicao<CotaPresente[]>(`${base(eventoId)}/${id}/cotas`)

/** Desfaz uma compra de cotas (ex.: o convidado não pagou); devolve o presente atualizado. */
export const excluirCota = (eventoId: number, id: number, cotaId: number) =>
  requisicao<Presente>(`${base(eventoId)}/${id}/cotas/${cotaId}`, 'DELETE')
