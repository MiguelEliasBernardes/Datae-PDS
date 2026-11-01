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
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
