import { requisicao } from './cliente'
import type {
  DadosDespesa,
  DadosFormando,
  DadosPagamento,
  Despesa,
  Formando,
  PagamentoFormando,
  Rateio,
} from './tipos'

/** Módulos exclusivos de eventos de formatura: formandos, despesas e rateio. */
const formandos = (eventoId: number) => `/api/eventos/${eventoId}/formandos`
const despesas = (eventoId: number) => `/api/eventos/${eventoId}/despesas`

export const listarFormandos = (eventoId: number) => requisicao<Formando[]>(formandos(eventoId))

export const criarFormando = (eventoId: number, dados: DadosFormando) =>
  requisicao<Formando>(formandos(eventoId), 'POST', dados)

export const atualizarFormando = (eventoId: number, id: number, dados: Partial<DadosFormando>) =>
  requisicao<Formando>(`${formandos(eventoId)}/${id}`, 'PUT', dados)

export const excluirFormando = (eventoId: number, id: number) =>
  requisicao<void>(`${formandos(eventoId)}/${id}`, 'DELETE')

export const listarDespesas = (eventoId: number) => requisicao<Despesa[]>(despesas(eventoId))

export const criarDespesa = (eventoId: number, dados: DadosDespesa) =>
  requisicao<Despesa>(despesas(eventoId), 'POST', dados)

export const atualizarDespesa = (eventoId: number, id: number, dados: Partial<DadosDespesa>) =>
  requisicao<Despesa>(`${despesas(eventoId)}/${id}`, 'PUT', dados)

export const excluirDespesa = (eventoId: number, id: number) =>
  requisicao<void>(`${despesas(eventoId)}/${id}`, 'DELETE')

export const obterRateio = (eventoId: number) => requisicao<Rateio>(`/api/eventos/${eventoId}/rateio`)

export const listarPagamentos = (eventoId: number, formandoId: number) =>
  requisicao<PagamentoFormando[]>(`${formandos(eventoId)}/${formandoId}/pagamentos`)

export const registrarPagamento = (eventoId: number, formandoId: number, dados: DadosPagamento) =>
  requisicao<PagamentoFormando>(`${formandos(eventoId)}/${formandoId}/pagamentos`, 'POST', dados)

export const excluirPagamento = (eventoId: number, formandoId: number, id: number) =>
  requisicao<void>(`${formandos(eventoId)}/${formandoId}/pagamentos/${id}`, 'DELETE')
