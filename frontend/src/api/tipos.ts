/** Tipos espelhando os DTOs do backend (Backend/Dtos). */

export type TipoEvento = 'ChaDePanela' | 'Casamento' | 'Aniversario' | 'Formatura'
export type StatusPresenca = 'Pendente' | 'Confirmado' | 'Recusado'
export type StatusPresente = 'Disponivel' | 'Reservado'

export interface Usuario {
  id: number
  nome: string
  email: string
  criadoEm: string
}

export interface RespostaLogin {
  token: string
  expiraEm: string
  usuario: Usuario
}

export interface Evento {
  id: number
  planoAtualId: number | null
  tipo: TipoEvento
  dataEvento: string
  nomeEvento: string
  local: string | null
  slugPublico: string
  descricao: string | null
  corPrincipal: string | null
  corSecundaria: string | null
  criadoEm: string
}

export interface DadosEvento {
  tipo: TipoEvento
  dataEvento: string
  nomeEvento: string
  local?: string
  slugPublico?: string
  descricao?: string
  corPrincipal?: string
  corSecundaria?: string
}

export interface Convidado {
  id: number
  eventoId: number
  nome: string
  email: string | null
  statusPresenca: StatusPresenca
  quantidadeAcompanhantes: number
  observacao: string | null
}

export interface DadosConvidado {
  nome: string
  email?: string
  statusPresenca?: StatusPresenca
  quantidadeAcompanhantes?: number
  observacao?: string
}

export interface Presente {
  id: number
  eventoId: number
  convidadoId: number | null
  nome: string
  descricao: string | null
  valorEstimado: number | null
  status: StatusPresente
  linkAfiliado: string | null
  foto: string | null
}

export interface DadosPresente {
  nome: string
  descricao?: string
  valorEstimado?: number | null
  status?: StatusPresente
  linkAfiliado?: string
  foto?: string
}
