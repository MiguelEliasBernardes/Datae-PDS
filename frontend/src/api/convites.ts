import { requisicao } from './cliente'
import type { Convite, Evento } from './tipos'

/** Convites para a comissão de formatura (link /convite/{codigo}). */
const base = (codigo: string) => `/api/convites/${encodeURIComponent(codigo)}`

/** Dados do convite para mostrar antes de aceitar (não exige login). */
export const obterConvite = (codigo: string) => requisicao<Convite>(base(codigo))

/** Entra na formatura; devolve o evento já com o papel e as permissões de quem aceitou. */
export const aceitarConvite = (codigo: string) => requisicao<Evento>(`${base(codigo)}/aceitar`, 'POST')
