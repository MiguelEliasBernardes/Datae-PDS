namespace Backend.Modelos;

public class Convidado
{
    public int Id { get; set; }
    public int EventoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Email { get; set; }

    // Telefone com DDI, só dígitos (ex.: 5511999998888), usado no link do WhatsApp do agradecimento
    public string? Telefone { get; set; }
    public StatusPresenca StatusPresenca { get; set; } = StatusPresenca.Pendente;
    public int QuantidadeAcompanhantes { get; set; }
    public string? Observacao { get; set; }

    // Quando o agradecimento pós-evento foi enviado por e-mail e quando o organizador abriu o WhatsApp
    public DateTime? AgradecimentoEmailEm { get; set; }
    public DateTime? AgradecimentoWhatsAppEm { get; set; }
}
