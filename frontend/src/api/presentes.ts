import { requisicao } from './cliente'
import type { DadosPresente, Presente } from './tipos'

const base = (eventoId: number) => `/api/eventos/${eventoId}/presentes`

export const listarPresentes = (eventoId: number) => requisicao<Presente[]>(base(eventoId))

export const criarPresente = (eventoId: number, dados: DadosPresente) =>
  requisicao<Presente>(base(eventoId), 'POST', dados)

export const atualizarPresente = (eventoId: number, id: number, dados: Partial<DadosPresente>) =>
  requisicao<Presente>(`${base(eventoId)}/${id}`, 'PUT', dados)

export const excluirPresente = (eventoId: number, id: number) =>
  requisicao<void>(`${base(eventoId)}/${id}`, 'DELETE')
