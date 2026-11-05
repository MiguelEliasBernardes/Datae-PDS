namespace Backend.Modelos;

public class FotoMural
{
    public int Id { get; set; }
    public int EventoId { get; set; }

    // Nome digitado pelo convidado ao enviar (opcional)
    public string? NomeAutor { get; set; }

    // Nome do arquivo salvo em disco, ex.: "3f2a...9c.jpg" (gerado pelo servidor, nunca vem do convidado)
    public string Arquivo { get; set; } = string.Empty;

    // Toda foto nasce pendente e só aparece no mural depois que o organizador aprova
    public StatusFoto Status { get; set; } = StatusFoto.Pendente;

    public DateTime EnviadaEm { get; set; } = DateTime.UtcNow;
}
