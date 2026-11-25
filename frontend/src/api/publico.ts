import { requisicao } from './cliente'
import type {
  CompraCotas,
  Contato,
  DadosPixInformado,
  DadosPresenca,
  EventoPublico,
  FormandoPublico,
  FotoPublica,
  PaginaFormando,
  Pix,
  Presenca,
  PresentePublico,
  Recapitulacao,
  RespostaReserva,
} from './tipos'

/** Rotas da página pública do evento: usadas pelos convidados, sem login. */
const base = (slug: string) => `/api/publico/eventos/${encodeURIComponent(slug)}`

export const obterEventoPublico = (slug: string) => requisicao<EventoPublico>(base(slug))

export const listarPresentesPublicos = (slug: string) => requisicao<PresentePublico[]>(`${base(slug)}/presentes`)

/** Formatura: formandos da turma e a sub-página de cada um. */
export const listarFormandosPublicos = (slug: string) => requisicao<FormandoPublico[]>(`${base(slug)}/formandos`)

export const obterPaginaFormando = (slug: string, slugFormando: string) =>
  requisicao<PaginaFormando>(`${base(slug)}/formandos/${encodeURIComponent(slugFormando)}`)

/** Lista pessoal do formando; reserva e cotas usam as mesmas funções dos presentes do evento. */
export const listarPresentesFormando = (slug: string, slugFormando: string) =>
  requisicao<PresentePublico[]>(`${base(slug)}/formandos/${encodeURIComponent(slugFormando)}/presentes`)

export const listarFotosPublicas = (slug: string) => requisicao<FotoPublica[]>(`${base(slug)}/fotos`)

export const confirmarPresenca = (slug: string, dados: DadosPresenca) =>
  requisicao<Presenca>(`${base(slug)}/presenca`, 'POST', dados)

export const reservarPresente = (slug: string, presenteId: number, nome: string, jaComprado: boolean, contato?: Contato) =>
  requisicao<RespostaReserva>(`${base(slug)}/presentes/${presenteId}/reserva`, 'POST', { nome, jaComprado, ...contato })

export const marcarPresenteComprado = (slug: string, presenteId: number, codigoReserva: string) =>
  requisicao<PresentePublico>(`${base(slug)}/presentes/${presenteId}/comprado`, 'POST', { codigoReserva })

export const cancelarReservaPresente = (slug: string, presenteId: number, codigoReserva: string) =>
  requisicao<PresentePublico>(`${base(slug)}/presentes/${presenteId}/cancelar-reserva`, 'POST', { codigoReserva })

export const comprarCotas = (slug: string, presenteId: number, nome: string, quantidade: number, contato?: Contato) =>
  requisicao<CompraCotas>(`${base(slug)}/presentes/${presenteId}/cotas`, 'POST', { nome, quantidade, ...contato })

/** Recapitulação do evento: só abre depois da data do evento (antes disso, 404). */
export const obterRecapitulacao = (slug: string) => requisicao<Recapitulacao>(`${base(slug)}/recapitulacao`)

/** Valor opcional: sem valor, o convidado digita o quanto quiser no app do banco. */
export const gerarPix = (slug: string, valor: number | null) => requisicao<Pix>(`${base(slug)}/pix`, 'POST', { valor })

/** "Já fiz o Pix": avisa o organizador, que confere no extrato (o Pix é estático). */
export const informarPix = (slug: string, dados: DadosPixInformado) =>
  requisicao<{ nome: string; valor: number }>(`${base(slug)}/pix/informar`, 'POST', dados)

export function enviarFotoMural(slug: string, arquivo: File, nomeAutor: string) {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  formulario.append('nomeAutor', nomeAutor)
  return requisicao<{ id: number; mensagem: string }>(`${base(slug)}/fotos`, 'POST', formulario)
}
