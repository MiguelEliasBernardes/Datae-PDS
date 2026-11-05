/** Tipos espelhando os DTOs do backend (Backend/Dtos). */

export type TipoEvento = 'ChaDePanela' | 'Casamento' | 'Aniversario' | 'Formatura'
export type StatusPresenca = 'Pendente' | 'Confirmado' | 'Recusado'
export type StatusPresente = 'Disponivel' | 'Reservado' | 'Comprado'
export type StatusFoto = 'Pendente' | 'Aprovada' | 'Recusada'

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
  chavePix: string | null
  nomeRecebedorPix: string | null
  cidadePix: string | null
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
  /** Texto vazio ("") desativa o Pix na página pública. */
  chavePix?: string
  nomeRecebedorPix?: string
  cidadePix?: string
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

/** Foto do mural, como o organizador vê na moderação. */
export interface Foto {
  id: number
  eventoId: number
  nomeAutor: string | null
  /** Caminho na API; use urlApi(url) no <img src>. */
  url: string
  status: StatusFoto
  enviadaEm: string
}

// ===== Página pública (convidados, sem login) =====

export interface EventoPublico {
  tipo: TipoEvento
  dataEvento: string
  nomeEvento: string
  local: string | null
  slugPublico: string
  descricao: string | null
  corPrincipal: string | null
  corSecundaria: string | null
  pixDisponivel: boolean
  nomeRecebedorPix: string | null
}

export interface PresentePublico {
  id: number
  nome: string
  descricao: string | null
  valorEstimado: number | null
  status: StatusPresente
  linkAfiliado: string | null
  foto: string | null
}

export interface DadosPresenca {
  nome: string
  vaiComparecer: boolean
  quantidadeAcompanhantes?: number
  observacao?: string
}

export interface Presenca {
  nome: string
  statusPresenca: StatusPresenca
  quantidadeAcompanhantes: number
  observacao: string | null
}

export interface RespostaReserva {
  presente: PresentePublico
  /** Guardado no navegador do convidado: só com ele dá para marcar como comprado ou cancelar. */
  codigoReserva: string
}

export interface Pix {
  copiaECola: string
  /** Imagem PNG em data URI. */
  qrCode: string
  valor: number | null
  nomeRecebedor: string
}

export interface FotoPublica {
  id: number
  nomeAutor: string | null
  url: string
  enviadaEm: string
}
