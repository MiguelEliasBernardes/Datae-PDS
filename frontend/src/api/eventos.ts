import { requisicao } from './cliente'
import type { DadosEvento, Evento } from './tipos'

export const listarEventos = () => requisicao<Evento[]>('/api/eventos')

export const obterEvento = (id: number) => requisicao<Evento>(`/api/eventos/${id}`)

export const criarEvento = (dados: DadosEvento) => requisicao<Evento>('/api/eventos', 'POST', dados)

export const atualizarEvento = (id: number, dados: Partial<DadosEvento>) =>
  requisicao<Evento>(`/api/eventos/${id}`, 'PUT', dados)

export const excluirEvento = (id: number) => requisicao<void>(`/api/eventos/${id}`, 'DELETE')

/** Troca a imagem de capa (banner da página pública e foto do cartão do evento). */
export function enviarBanner(id: number, arquivo: File) {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  return requisicao<Evento>(`/api/eventos/${id}/banner`, 'PUT', formulario)
}

export const removerBanner = (id: number) => requisicao<Evento>(`/api/eventos/${id}/banner`, 'DELETE')
