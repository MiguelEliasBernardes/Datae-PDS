import type { Evento, Permissao } from '../api/tipos'

/** Se o usuário pode fazer algo no evento (as permissões vêm do backend, a partir do papel dele). */
export const pode = (evento: Pick<Evento, 'permissoes'>, permissao: Permissao) => evento.permissoes.includes(permissao)
