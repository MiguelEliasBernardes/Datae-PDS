import { requisicao } from './cliente'
import type {
  DadosPresenca,
  EventoPublico,
  FotoPublica,
  Pix,
  Presenca,
  PresentePublico,
  RespostaReserva,
} from './tipos'

/** Rotas da página pública do evento: usadas pelos convidados, sem login. */
const base = (slug: string) => `/api/publico/eventos/${encodeURIComponent(slug)}`

export const obterEventoPublico = (slug: string) => requisicao<EventoPublico>(base(slug))

export const listarPresentesPublicos = (slug: string) => requisicao<PresentePublico[]>(`${base(slug)}/presentes`)

export const listarFotosPublicas = (slug: string) => requisicao<FotoPublica[]>(`${base(slug)}/fotos`)

export const confirmarPresenca = (slug: string, dados: DadosPresenca) =>
  requisicao<Presenca>(`${base(slug)}/presenca`, 'POST', dados)

export const reservarPresente = (slug: string, presenteId: number, nome: string, jaComprado: boolean) =>
  requisicao<RespostaReserva>(`${base(slug)}/presentes/${presenteId}/reserva`, 'POST', { nome, jaComprado })

export const marcarPresenteComprado = (slug: string, presenteId: number, codigoReserva: string) =>
  requisicao<PresentePublico>(`${base(slug)}/presentes/${presenteId}/comprado`, 'POST', { codigoReserva })

export const cancelarReservaPresente = (slug: string, presenteId: number, codigoReserva: string) =>
  requisicao<PresentePublico>(`${base(slug)}/presentes/${presenteId}/cancelar-reserva`, 'POST', { codigoReserva })

/** Valor opcional: sem valor, o convidado digita o quanto quiser no app do banco. */
export const gerarPix = (slug: string, valor: number | null) => requisicao<Pix>(`${base(slug)}/pix`, 'POST', { valor })

export function enviarFotoMural(slug: string, arquivo: File, nomeAutor: string) {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  formulario.append('nomeAutor', nomeAutor)
  return requisicao<{ id: number; mensagem: string }>(`${base(slug)}/fotos`, 'POST', formulario)
}
