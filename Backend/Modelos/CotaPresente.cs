namespace Backend.Modelos;

/// <summary>Cotas de um presente compradas por um convidado na página pública.</summary>
public class CotaPresente
{
    public int Id { get; set; }
    public int ItemPresenteId { get; set; }

    // Convidado da lista (nulo se ele for excluído depois); o nome fica guardado à parte
    public int? ConvidadoId { get; set; }
    public string NomeConvidado { get; set; } = string.Empty;

    public int Quantidade { get; set; }

    // Valor total das cotas no momento da compra (o organizador pode mudar o preço depois)
    public decimal Valor { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
