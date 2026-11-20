namespace Backend.Modelos;

public class Evento
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    // A tabela de planos ainda não existe; quando existir, vira chave estrangeira
    public int? PlanoAtualId { get; set; }

    public TipoEvento Tipo { get; set; }
    public DateTime DataEvento { get; set; }
    public string NomeEvento { get; set; } = string.Empty;
    public string? Local { get; set; }
    public string SlugPublico { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? CorPrincipal { get; set; }
    public string? CorSecundaria { get; set; }

    // Nome do arquivo da imagem de capa (ver ArmazenamentoArquivos); nulo = imagem padrão
    public string? Banner { get; set; }

    // Pix estático para presente em dinheiro (nulo = opção desativada na página pública)
    public string? ChavePix { get; set; }
    public string? NomeRecebedorPix { get; set; }
    public string? CidadePix { get; set; }

    // Código de convite geral da turma (só formatura): quem entra por ele vira um formando novo.
    // Nulo = desativado
    public string? CodigoTurma { get; set; }

    // Quando as sugestões da checklist foram copiadas para o evento (nulo = checklist ainda não aberta).
    // Assim as sugestões entram uma vez só, mesmo que o organizador apague todos os itens depois
    public DateTime? ChecklistCriadaEm { get; set; }

    // Seções opcionais da página pública (desativadas, somem da página e as rotas públicas recusam o uso)
    public bool ListaPresentesAtiva { get; set; } = true;
    public bool MuralAtivo { get; set; } = true;

    // Pós-evento: recado do organizador no agradecimento e na página de recapitulação (nulo = texto padrão)
    public string? MensagemAgradecimento { get; set; }

    // Quando o resumo do pós-evento foi enviado por e-mail ao dono (o envio automático acontece uma vez só)
    public DateTime? ResumoEnviadoEm { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
