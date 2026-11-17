/** Tipos espelhando os DTOs do backend (Backend/Dtos). */

export type TipoEvento = 'ChaDePanela' | 'Casamento' | 'Aniversario' | 'Formatura'
export type StatusPresenca = 'Pendente' | 'Confirmado' | 'Recusado'
export type StatusPresente = 'Disponivel' | 'Reservado' | 'Comprado'
export type StatusFoto = 'Pendente' | 'Aprovada' | 'Recusada'
export type PapelFormando = 'Membro' | 'Administrador' | 'Financeiro' | 'Fotos'
/** O que o usuário pode fazer no evento (calculado pelo backend a partir do papel). */
export type Permissao = 'VerEvento' | 'GerenciarEvento' | 'GerenciarComissao' | 'Financeiro' | 'ModerarMural'

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
  listaPresentesAtiva: boolean
  muralAtivo: boolean
  /** Caminho na API (use urlApi no <img src>); nulo = imagem padrão. */
  bannerUrl: string | null
  criadoEm: string
  /** Se quem está vendo criou o evento. */
  organizador: boolean
  /** Papel na comissão de formatura (null para o organizador que não é formando). */
  meuPapel: PapelFormando | null
  permissoes: Permissao[]
  /** Código de convite geral da turma; só vem para quem gerencia a comissão (null = desativado). */
  codigoTurma: string | null
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
  listaPresentesAtiva?: boolean
  muralAtivo?: boolean
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
  /** Presente dividido em cotas (null = presente inteiro). */
  quantidadeCotas: number | null
  cotasVendidas: number
  valorCota: number | null
}

export interface DadosPresente {
  nome: string
  descricao?: string
  valorEstimado?: number | null
  status?: StatusPresente
  linkAfiliado?: string
  foto?: string
  /** 0 volta a ser um presente inteiro. */
  quantidadeCotas?: number
}

/** Compra de cotas feita por um convidado na página pública. */
export interface CotaPresente {
  id: number
  itemPresenteId: number
  convidadoId: number | null
  nomeConvidado: string
  quantidade: number
  valor: number
  criadoEm: string
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
  bannerUrl: string | null
  listaPresentesAtiva: boolean
  muralAtivo: boolean
}

export interface PresentePublico {
  id: number
  nome: string
  descricao: string | null
  valorEstimado: number | null
  status: StatusPresente
  linkAfiliado: string | null
  foto: string | null
  quantidadeCotas: number | null
  cotasVendidas: number
  valorCota: number | null
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

export interface CompraCotas {
  presente: PresentePublico
  quantidade: number
  valor: number | null
  /** Null quando o evento não tem Pix configurado. */
  pix: Pix | null
}

export interface FormandoPublico {
  nome: string
  slug: string
}

/** Sub-página pública de um formando. */
export interface PaginaFormando {
  evento: EventoPublico
  formando: FormandoPublico & { mensagem: string | null }
}

export interface FotoPublica {
  id: number
  nomeAutor: string | null
  url: string
  enviadaEm: string
}

// ===== Formatura =====

export interface Formando {
  id: number
  eventoId: number
  nome: string
  email: string | null
  papel: PapelFormando
  criadoEm: string
  /** Endereço da sub-página pública: /e/{slug do evento}/{slug}. */
  slug: string
  mensagem: string | null
  /** Já entrou na turma por convite (tem conta ligada). */
  vinculado: boolean
  /** Código do convite individual; null depois que alguém aceita. */
  codigoConvite: string | null
}

export interface Convite {
  /** Formando: liga a conta a um formando já cadastrado. Turma: cria um formando novo. */
  tipo: 'Formando' | 'Turma'
  nomeEvento: string
  dataEvento: string
  nomeFormando: string | null
}

export interface DadosFormando {
  nome: string
  email?: string
  papel?: PapelFormando
}

export interface Despesa {
  id: number
  eventoId: number
  descricao: string
  valor: number
  data: string | null
  criadoEm: string
}

export interface DadosDespesa {
  descricao: string
  valor: number
  data?: string | null
}

export interface PagamentoFormando {
  id: number
  formandoId: number
  valor: number
  pagoEm: string
  observacao: string | null
}

export interface DadosPagamento {
  valor: number
  /** Sem data, vale o momento do registro. */
  pagoEm?: string | null
  observacao?: string
}

export interface RateioFormando {
  formandoId: number
  nome: string
  papel: PapelFormando
  valorPago: number
  valorDevido: number
  percentual: number
  quitado: boolean
}

export interface Rateio {
  totalDespesas: number
  quantidadeFormandos: number
  valorPorFormando: number
  totalPago: number
  percentualPago: number
  formandos: RateioFormando[]
}
