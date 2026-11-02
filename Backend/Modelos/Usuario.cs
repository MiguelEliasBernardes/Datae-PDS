namespace Backend.Modelos;

public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Nulo para quem criou a conta pelo Google e nunca definiu uma senha
    public string? SenhaHash { get; set; }

    // Identificador da conta Google ("sub" do token); nulo se nunca entrou com o Google
    public string? GoogleId { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
