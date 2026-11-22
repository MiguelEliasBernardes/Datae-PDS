import { requisicao } from './cliente'
import type { PedidoRoteiro, PedidoSugestoesPresentes, Roteiro, StatusAssistente, SugestoesPresentes } from './tipos'

/**
 * Assistente de IA. As rotas só devolvem sugestões: o que o organizador escolher é salvo
 * pelas rotas de presentes (`criarPresente`) e da checklist (`criarItemChecklist`).
 * Cada lista tem um número limitado de gerações (`geracoesRestantes`).
 */
const base = (eventoId: number) => `/api/eventos/${eventoId}/assistente`

export const obterStatusAssistente = (eventoId: number, minhaLista = false) =>
  requisicao<StatusAssistente>(`${base(eventoId)}${minhaLista ? '?minhaLista=true' : ''}`)

export const sugerirPresentes = (eventoId: number, pedido: PedidoSugestoesPresentes) =>
  requisicao<SugestoesPresentes>(`${base(eventoId)}/presentes`, 'POST', pedido)

export const sugerirRoteiro = (eventoId: number, pedido: PedidoRoteiro) =>
  requisicao<Roteiro>(`${base(eventoId)}/roteiro`, 'POST', pedido)
