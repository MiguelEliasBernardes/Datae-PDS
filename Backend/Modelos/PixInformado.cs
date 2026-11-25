namespace Backend.Modelos;

/// <summary>
/// Aviso do convidado de que fez um Pix pela página pública ("Já fiz o Pix"). Como o Pix é estático,
/// o sistema não sabe se o dinheiro caiu: o aviso chega aguardando conferência, e o organizador
/// marca como conferido depois de ver no extrato (ou exclui, se for falso).
/// </summary>
public class PixInformado
{
    public int Id { get; set; }
    public int EventoId { get; set; }

    // Convidado da lista (nulo se ele for excluído depois); o nome fica guardado à parte
    public int? ConvidadoId { get; set; }
    public string NomeConvidado { get; set; } = string.Empty;

    // Pix das cotas de um presente (nulo = Pix livre, o "presente em dinheiro"). Uma compra de cotas tem no máximo um aviso
    public int? CotaPresenteId { get; set; }

    // Pix livre feito pela sub-página de um formando (nulo = página do evento)
    public int? FormandoId { get; set; }

    public decimal Valor { get; set; }
    public string? Recado { get; set; }

    public bool Conferido { get; set; }
    public DateTime? ConferidoEm { get; set; }

    public DateTime InformadoEm { get; set; } = DateTime.UtcNow;
}
