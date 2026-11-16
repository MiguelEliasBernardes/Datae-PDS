namespace Backend.Modelos;

/// <summary>Integrante da turma num evento de formatura; divide as despesas no rateio.</summary>
public class Formando
{
    public int Id { get; set; }
    public int EventoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Email { get; set; }
    public PapelFormando Papel { get; set; } = PapelFormando.Membro;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
