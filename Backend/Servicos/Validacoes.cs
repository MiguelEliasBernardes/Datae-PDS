using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Backend.Servicos;

/// <summary>Regras de validação e normalização usadas por mais de um serviço.</summary>
public static partial class Validacoes
{
    public static string NormalizarEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    public static bool EmailValido(string email) =>
        email.Length > 3 && email.Contains('@') && !email.StartsWith('@') && !email.EndsWith('@');

    /// <summary>
    /// Padroniza o telefone para o formato do WhatsApp (só dígitos, com DDI) e devolve nulo se for inválido.
    /// Sem DDI, o número é tratado como brasileiro: "(11) 99999-8888" vira "5511999998888".
    /// Com "+", aceita qualquer país: "+351 912 345 678" vira "351912345678".
    /// </summary>
    public static string? NormalizarTelefone(string? telefone)
    {
        var texto = (telefone ?? string.Empty).Trim();
        if (!RegexDocumentoOuTelefone().IsMatch(texto))
            return null;

        var digitos = new string(texto.Where(char.IsAsciiDigit).ToArray());
        if (texto.StartsWith('+'))
            return digitos.Length is >= 8 and <= 15 ? digitos : null;
        if (digitos.Length is 10 or 11)
            return $"55{digitos}";
        if (digitos.Length is 12 or 13 && digitos.StartsWith("55"))
            return digitos;

        return null;
    }

    /// <summary>
    /// Valida os contatos opcionais (telefone e e-mail) e devolve os valores padronizados.
    /// Campo vazio vira nulo; os erros vão para "telefone" e "email".
    /// </summary>
    public static (string? Telefone, string? Email) ValidarContato(
        string? telefone, string? email, Dictionary<string, string[]> erros)
    {
        string? telefoneNormalizado = null;
        if (TextoOpcional(telefone) is not null)
        {
            telefoneNormalizado = NormalizarTelefone(telefone);
            if (telefoneNormalizado is null)
                erros["telefone"] = ["Informe o telefone com DDD, ex.: (11) 99999-8888."];
        }

        string? emailNormalizado = null;
        if (TextoOpcional(email) is not null)
        {
            emailNormalizado = NormalizarEmail(email);
            if (!EmailValido(emailNormalizado) || emailNormalizado.Length > 200 || emailNormalizado.Contains(' '))
            {
                erros["email"] = ["Informe um e-mail válido."];
                emailNormalizado = null;
            }
        }

        return (telefoneNormalizado, emailNormalizado);
    }

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

    /// <summary>
    /// Endereço amigável a partir de um texto: "Casamento de Ana & Pedro" vira "casamento-de-ana-pedro".
    /// Se não sobrar nada (ex.: só símbolos), usa <paramref name="padrao"/>.
    /// </summary>
    public static string GerarSlug(string texto, string padrao, int tamanhoMaximo)
    {
        var semAcento = new StringBuilder();
        foreach (var caractere in (texto ?? string.Empty).Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(caractere) != UnicodeCategory.NonSpacingMark)
                semAcento.Append(caractere);
        }

        var slug = new StringBuilder();
        foreach (var caractere in semAcento.ToString().ToLowerInvariant())
        {
            if (char.IsAsciiLetterOrDigit(caractere))
                slug.Append(caractere);
            else if (slug.Length > 0 && slug[^1] != '-')
                slug.Append('-');
        }

        var resultado = slug.ToString().Trim('-');
        if (resultado.Length > tamanhoMaximo)
            resultado = resultado[..tamanhoMaximo].Trim('-');

        return resultado.Length == 0 ? padrao : resultado;
    }

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex RegexCor();

    [GeneratedRegex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")]
    private static partial Regex RegexChaveAleatoria();

    [GeneratedRegex(@"^\+?[0-9.\-/() ]+$")]
    private static partial Regex RegexDocumentoOuTelefone();
}
