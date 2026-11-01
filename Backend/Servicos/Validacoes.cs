using System.Text.RegularExpressions;

namespace Backend.Servicos;

/// <summary>Regras de validação e normalização usadas por mais de um serviço.</summary>
public static partial class Validacoes
{
    public static string NormalizarEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    public static bool EmailValido(string email) =>
        email.Length > 3 && email.Contains('@') && !email.StartsWith('@') && !email.EndsWith('@');

    /// <summary>Remove espaços nas pontas e transforma texto vazio em nulo.</summary>
    public static string? TextoOpcional(string? texto) => string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

    /// <summary>Cor no formato hexadecimal, ex.: #A1B2C3.</summary>
    public static bool CorValida(string? cor) => cor is null || RegexCor().IsMatch(cor);

    /// <summary>O PostgreSQL só aceita datas em UTC; datas sem fuso são tratadas como UTC.</summary>
    public static DateTime ParaUtc(DateTime data) => data.Kind switch
    {
        DateTimeKind.Utc => data,
        DateTimeKind.Local => data.ToUniversalTime(),
        _ => DateTime.SpecifyKind(data, DateTimeKind.Utc),
    };

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex RegexCor();
}
