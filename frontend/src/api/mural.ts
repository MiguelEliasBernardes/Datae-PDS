import { requisicao } from './cliente'
import type { Foto, StatusFoto } from './tipos'

const base = (eventoId: number) => `/api/eventos/${eventoId}/fotos`

export const listarFotos = (eventoId: number) => requisicao<Foto[]>(base(eventoId))

export const moderarFoto = (eventoId: number, id: number, status: StatusFoto) =>
  requisicao<Foto>(`${base(eventoId)}/${id}`, 'PUT', { status })

export const excluirFoto = (eventoId: number, id: number) => requisicao<void>(`${base(eventoId)}/${id}`, 'DELETE')
