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

    /// <summary>"  Maria   da  Silva " vira "Maria da Silva" (usado para achar o convidado pelo nome).</summary>
    public static string NormalizarNome(string? nome) =>
        string.Join(' ', (nome ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

    /// <summary>
    /// Padroniza a chave Pix e devolve nulo se ela não for de nenhum tipo aceito:
    /// e-mail, CPF (11 dígitos), CNPJ (14 dígitos), telefone (+55...) ou chave aleatória.
    /// Pontuação de CPF/CNPJ é removida: "123.456.789-09" vira "12345678909".
    /// </summary>
    public static string? NormalizarChavePix(string? chave)
    {
        var texto = (chave ?? string.Empty).Trim();

        if (RegexChaveAleatoria().IsMatch(texto))
            return texto.ToLowerInvariant();

        if (texto.Contains('@'))
        {
            var email = NormalizarEmail(texto);
            return EmailValido(email) && email.Length <= 77 && !email.Contains(' ') ? email : null;
        }

        var digitos = new string(texto.Where(char.IsAsciiDigit).ToArray());

        if (texto.StartsWith('+'))
            return RegexDocumentoOuTelefone().IsMatch(texto) && digitos.Length is >= 12 and <= 13 ? $"+{digitos}" : null;

        return RegexDocumentoOuTelefone().IsMatch(texto) && digitos.Length is 11 or 14 ? digitos : null;
    }

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex RegexCor();

    [GeneratedRegex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")]
    private static partial Regex RegexChaveAleatoria();

    [GeneratedRegex(@"^\+?[0-9.\-/() ]+$")]
    private static partial Regex RegexDocumentoOuTelefone();
}
