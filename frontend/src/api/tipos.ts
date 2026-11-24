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
  /** False: conta criada pelo Google que ainda não definiu uma senha. */
  temSenha: boolean
}

/** Alteração da conta logada: só os campos enviados mudam. E-mail e senha novos exigem a senha atual. */
export interface DadosConta {
  nome?: string
  email?: string
  senhaAtual?: string
  novaSenha?: string
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
  /** Recado do agradecimento pós-evento e da recapitulação (null = texto padrão). */
  mensagemAgradecimento: string | null
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
  /** Texto vazio ("") volta para a mensagem padrão. */
  mensagemAgradecimento?: string
}

export interface Convidado {
  id: number
  eventoId: number
  nome: string
  email: string | null
  /** Só dígitos, com DDI (ex.: 5511999998888). */
  telefone: string | null
  statusPresenca: StatusPresenca
  quantidadeAcompanhantes: number
  observacao: string | null
}

export interface DadosConvidado {
  nome: string
  email?: string
  telefone?: string
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

/** Contatos opcionais que o convidado deixa na página pública, para receber o agradecimento. */
export interface Contato {
  telefone: string
  email: string
}

export interface DadosPresenca extends Partial<Contato> {
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

// ===== Checklist =====

export type CategoriaChecklist = 'Preparativos' | 'Cerimonia' | 'Decoracao' | 'Brincadeiras' | 'Itens'
/** Tela que resolve a dica. */
export type AcaoDica =
  | 'Configuracoes'
  | 'Presentes'
  | 'MeusPresentes'
  | 'Convidados'
  | 'Mural'
  | 'Formandos'
  | 'Despesas'
  | 'Rateio'
  | 'PosEvento'

export interface ItemChecklist {
  id: number
  titulo: string
  descricao: string | null
  categoria: CategoriaChecklist
  /** Quantos dias antes do evento (0 = no dia; null = sem prazo). */
  diasAntes: number | null
  /** Data limite já calculada pelo backend a partir da data do evento. */
  prazo: string | null
  concluido: boolean
  concluidoEm: string | null
  origem: 'Sugestao' | 'Manual'
  responsavelFormandoId: number | null
  responsavelNome: string | null
  /** Quem está vendo pode marcar como feito (quem gerencia ou o responsável pelo item). */
  podeConcluir: boolean
  /** Item da categoria Itens que pode virar presente da lista do evento. */
  podeVirarPresente: boolean
}

/** Dica calculada a partir do estado do evento (não fica gravada). */
export interface DicaChecklist {
  chave: string
  titulo: string
  descricao: string | null
  concluida: boolean
  acao: AcaoDica
}

export interface Checklist {
  itens: ItemChecklist[]
  dicas: DicaChecklist[]
  /** Pode criar, editar e apagar itens (organizador e administradores). */
  podeGerenciar: boolean
}

export interface DadosItemChecklist {
  titulo: string
  descricao?: string
  categoria?: CategoriaChecklist
  /** Na edição, -1 tira o prazo. */
  diasAntes?: number | null
  /** Na edição, 0 tira o responsável. */
  responsavelFormandoId?: number | null
}

export interface SugestaoChecklist {
  chave: string
  titulo: string
  descricao: string | null
  categoria: CategoriaChecklist
  diasAntes: number | null
  valorSugerido: number | null
}

// ===== Pós-evento =====

export interface PresenteRecebido {
  id: number
  nome: string
  valor: number | null
  status: StatusPresente
  nomeConvidado: string | null
  /** Lista pessoal de um formando (null = lista do evento). */
  nomeFormando: string | null
}

export interface CompraCotaResumo {
  nomeConvidado: string
  quantidade: number
  valor: number
  compradaEm: string
}

export interface PresenteCotasResumo {
  id: number
  nome: string
  valorEstimado: number | null
  quantidadeCotas: number
  cotasVendidas: number
  valorArrecadado: number
  nomeFormando: string | null
  compras: CompraCotaResumo[]
}

/** Convidado a quem agradecer, com a mensagem já personalizada. */
export interface Agradecimento {
  convidadoId: number
  nome: string
  telefone: string | null
  email: string | null
  motivos: string[]
  mensagem: string
  /** Link wa.me com a mensagem pronta (null sem telefone). */
  linkWhatsApp: string | null
  emailEnviadoEm: string | null
  whatsAppAbertoEm: string | null
}

export interface ResumoPosEvento {
  nomeEvento: string
  dataEvento: string
  eventoRealizado: boolean
  /** Estimado: presentes inteiros reservados/comprados (com valor) + cotas vendidas. */
  totalArrecadado: number
  valorPresentes: number
  valorCotas: number
  presentesComprados: number
  presentesReservados: number
  cotasVendidas: number
  presenteadores: number
  confirmados: number
  acompanhantes: number
  recusados: number
  pendentes: number
  fotosAprovadas: number
  presentes: PresenteRecebido[]
  presentesComCotas: PresenteCotasResumo[]
  agradecimentos: Agradecimento[]
  mensagemAgradecimento: string | null
  mensagemPadrao: string
  linkRecapitulacao: string
  /** False quando o servidor não tem e-mail configurado. */
  emailDisponivel: boolean
  resumoEnviadoEm: string | null
}

export interface EnvioAgradecimentos {
  enviados: number
  falhas: number
  resumo: ResumoPosEvento
}

/** Página de recapitulação: só números gerais, sem valores nem nomes de quem deu presente. */
export interface Recapitulacao {
  evento: EventoPublico
  mensagemAgradecimento: string
  pessoasPresentes: number
  presentesRecebidos: number
  presenteadores: number
  fotos: FotoPublica[]
}

/* ===== Assistente de IA (só sugere; o que o organizador escolher é salvo pelas rotas normais) ===== */

export type EstiloPresente = 'Cozinha' | 'Casa' | 'Decoracao' | 'Tecnologia' | 'Experiencias' | 'Pessoal' | 'Lazer'
export type PublicoEvento = 'Adultos' | 'Familia' | 'Jovens' | 'Criancas'

export interface StatusAssistente {
  /** False quando o servidor não tem a chave da IA configurada. */
  disponivel: boolean
  geracoesRestantes: number
  limiteGeracoes: number
}

export interface PedidoSugestoesPresentes {
  minhaLista?: boolean
  valorMinimo?: number | null
  valorMaximo?: number | null
  estilos?: EstiloPresente[]
  quantidade?: number
  observacoes?: string
}

export interface PresenteSugerido {
  nome: string
  descricao: string | null
  valorEstimado: number | null
  /** Nulo = presente inteiro. */
  quantidadeCotas: number | null
}

export interface SugestoesPresentes {
  presentes: PresenteSugerido[]
  geracoesRestantes: number
}

export interface PedidoRoteiro {
  /** HH:mm */
  horarioInicio: string
  duracaoHoras: number
  publico: PublicoEvento
  observacoes?: string
}

export interface MomentoRoteiro {
  horario: string
  titulo: string
  descricao: string | null
}

export interface BrincadeiraSugerida {
  titulo: string
  descricao: string | null
  materiais: string | null
}

export interface Roteiro {
  momentos: MomentoRoteiro[]
  brincadeiras: BrincadeiraSugerida[]
  geracoesRestantes: number
}
