namespace Backend.Modelos;

/// <summary>
/// Pessoa que ajuda a organizar um evento que não é formatura (chá de panela, casamento, aniversário).
/// Entra pelo código de convite da organização (<see cref="Evento.CodigoOrganizacao"/>) e pode tudo no evento,
/// menos excluí-lo e convidar ou remover outras pessoas da organização (isso é só do dono).
/// Na formatura, quem ajuda é a comissão de formandos, com papéis.
/// </summary>
public class CoOrganizador
{
    public int Id { get; set; }
    public int EventoId { get; set; }
    public int UsuarioId { get; set; }
    public DateTime EntrouEm { get; set; } = DateTime.UtcNow;
}
