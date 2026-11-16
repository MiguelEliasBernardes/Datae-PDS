namespace Backend.Modelos;

/// <summary>Valor que um formando já pagou da parte dele no rateio (registrado pelo organizador).</summary>
public class PagamentoFormando
{
    public int Id { get; set; }
    public int FormandoId { get; set; }
    public decimal Valor { get; set; }
    public DateTime PagoEm { get; set; } = DateTime.UtcNow;
    public string? Observacao { get; set; }
}
