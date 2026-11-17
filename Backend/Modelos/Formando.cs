namespace Backend.Modelos;

/// <summary>
/// Integrante da turma num evento de formatura; divide as despesas no rateio.
/// Ao aceitar um convite, o formando fica ligado a uma conta e passa a acessar o evento com o papel dele.
/// </summary>
public class Formando
{
    public int Id { get; set; }
    public int EventoId { get; set; }

    // Conta que aceitou o convite (nulo enquanto o formando não entrou)
    public int? UsuarioId { get; set; }

    // Código do convite individual; vira nulo quando o formando entra (o código só serve uma vez)
    public string? CodigoConvite { get; set; }

    public string Nome { get; set; } = string.Empty;
    public string? Email { get; set; }
    public PapelFormando Papel { get; set; } = PapelFormando.Membro;

    // Endereço da sub-página pública do formando: /e/{slug do evento}/{Slug}
    public string Slug { get; set; } = string.Empty;

    // Recado do formando na sub-página pública (ex.: agradecimento aos convidados)
    public string? Mensagem { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
