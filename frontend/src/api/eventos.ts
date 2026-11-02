import { requisicao } from './cliente'
import type { DadosEvento, Evento } from './tipos'

export const listarEventos = () => requisicao<Evento[]>('/api/eventos')

export const obterEvento = (id: number) => requisicao<Evento>(`/api/eventos/${id}`)

export const criarEvento = (dados: DadosEvento) => requisicao<Evento>('/api/eventos', 'POST', dados)

export const atualizarEvento = (id: number, dados: Partial<DadosEvento>) =>
  requisicao<Evento>(`/api/eventos/${id}`, 'PUT', dados)

export const excluirEvento = (id: number) => requisicao<void>(`/api/eventos/${id}`, 'DELETE')
