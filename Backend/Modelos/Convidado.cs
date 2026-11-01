namespace Backend.Modelos;

public class Convidado
{
    public int Id { get; set; }
    public int EventoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Email { get; set; }
    public StatusPresenca StatusPresenca { get; set; } = StatusPresenca.Pendente;
    public int QuantidadeAcompanhantes { get; set; }
    public string? Observacao { get; set; }
}
