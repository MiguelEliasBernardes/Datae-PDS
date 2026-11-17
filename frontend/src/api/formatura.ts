import { requisicao } from './cliente'
import type {
  DadosDespesa,
  Evento,
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

/** Gera outro código de convite para o formando (o anterior deixa de valer). */
export const gerarNovoConvite = (eventoId: number, id: number) =>
  requisicao<Formando>(`${formandos(eventoId)}/${id}/convite`, 'POST')

/** Tira o acesso da conta que entrou como este formando; ele ganha um convite novo. */
export const desvincularFormando = (eventoId: number, id: number) =>
  requisicao<Formando>(`${formandos(eventoId)}/${id}/vinculo`, 'DELETE')

/** O formando ligado à conta logada (sub-página dele). */
export const obterMeuFormando = (eventoId: number) => requisicao<Formando>(`${formandos(eventoId)}/eu`)

export const atualizarMeuFormando = (eventoId: number, dados: { mensagem: string }) =>
  requisicao<Formando>(`${formandos(eventoId)}/eu`, 'PUT', dados)

/** Liga (ou troca) o código geral da turma; devolve o evento com o código novo. */
export const gerarCodigoTurma = (eventoId: number) =>
  requisicao<Evento>(`/api/eventos/${eventoId}/codigo-turma`, 'POST')

export const desativarCodigoTurma = (eventoId: number) =>
  requisicao<Evento>(`/api/eventos/${eventoId}/codigo-turma`, 'DELETE')

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
