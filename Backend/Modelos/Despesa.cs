namespace Backend.Modelos;

/// <summary>Gasto da formatura (buffet, salão, fotógrafo...). A soma das despesas é dividida entre os formandos.</summary>
public class Despesa
{
    public int Id { get; set; }
    public int EventoId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }

    // Data de vencimento ou do pagamento ao fornecedor (opcional)
    public DateTime? Data { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
