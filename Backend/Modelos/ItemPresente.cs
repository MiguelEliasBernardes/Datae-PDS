namespace Backend.Modelos;

public class ItemPresente
{
    public int Id { get; set; }
    public int EventoId { get; set; }

    // Convidado que reservou o presente (nulo enquanto estiver disponível)
    public int? ConvidadoId { get; set; }

    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public decimal? ValorEstimado { get; set; }
    public StatusPresente Status { get; set; } = StatusPresente.Disponivel;
    public string? LinkAfiliado { get; set; }
    public string? Foto { get; set; }
}
