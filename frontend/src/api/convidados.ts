import { requisicao } from './cliente'
import type { Convidado, DadosConvidado } from './tipos'

const base = (eventoId: number) => `/api/eventos/${eventoId}/convidados`

export const listarConvidados = (eventoId: number) => requisicao<Convidado[]>(base(eventoId))

export const criarConvidado = (eventoId: number, dados: DadosConvidado) =>
  requisicao<Convidado>(base(eventoId), 'POST', dados)

export const atualizarConvidado = (eventoId: number, id: number, dados: Partial<DadosConvidado>) =>
  requisicao<Convidado>(`${base(eventoId)}/${id}`, 'PUT', dados)

export const excluirConvidado = (eventoId: number, id: number) =>
  requisicao<void>(`${base(eventoId)}/${id}`, 'DELETE')
