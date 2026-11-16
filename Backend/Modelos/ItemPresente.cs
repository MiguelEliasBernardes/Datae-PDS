namespace Backend.Modelos;

public class ItemPresente
{
    public int Id { get; set; }
    public int EventoId { get; set; }

    // Convidado que reservou o presente (nulo enquanto estiver disponível)
    public int? ConvidadoId { get; set; }

    // Código entregue ao convidado ao reservar pela página pública; só quem tem o código
    // pode marcar o presente como comprado ou cancelar a reserva
    public string? CodigoReserva { get; set; }

    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public decimal? ValorEstimado { get; set; }
    public StatusPresente Status { get; set; } = StatusPresente.Disponivel;
    public string? LinkAfiliado { get; set; }
    public string? Foto { get; set; }

    // Presente dividido em cotas (nulo = presente inteiro, reservado por uma pessoa só).
    // Com cotas, o status é calculado: Disponivel enquanto sobrar cota, Comprado quando todas forem vendidas.
    public int? QuantidadeCotas { get; set; }
    public int CotasVendidas { get; set; }

    /// <summary>Preço de cada cota, ou nulo se o presente não tem cotas ou não tem valor.</summary>
    public decimal? ValorCota => QuantidadeCotas is int cotas && ValorEstimado is decimal valor
        ? decimal.Round(valor / cotas, 2, MidpointRounding.AwayFromZero)
        : null;
}
