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
    /// e-mail, CPF (11 dígitos), CNPJ (14 dígitos), telefone (+55 com DDD) ou chave aleatória.
    /// Pontuação é removida: "123.456.789-09" vira "12345678909" e "+55 (11) 99999-8888" vira "+5511999998888".
    /// CPF e CNPJ precisam ter os dígitos verificadores certos. O telefone precisa do "+": sem ele,
    /// 11 dígitos são lidos como CPF (o frontend acrescenta o +55 quando o tipo escolhido é telefone).
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

        if (!RegexDocumentoOuTelefone().IsMatch(texto))
            return null;

        var digitos = new string(texto.Where(char.IsAsciiDigit).ToArray());

        // Telefone: +55, DDD (não começa com 0) e número de 8 ou 9 dígitos
        if (texto.StartsWith('+'))
            return digitos.Length is 12 or 13 && digitos.StartsWith("55") && digitos[2] != '0' ? $"+{digitos}" : null;

        return digitos.Length switch
        {
            11 when CpfValido(digitos) => digitos,
            14 when CnpjValido(digitos) => digitos,
            _ => null,
        };
    }

    /// <summary>Confere os dois dígitos verificadores de um CPF (só dígitos).</summary>
    public static bool CpfValido(string cpf)
    {
        if (cpf.Length != 11 || !cpf.All(char.IsAsciiDigit) || cpf.Distinct().Count() == 1)
            return false;

        return DigitoVerificador(cpf[..9], 10) == cpf[9] - '0'
            && DigitoVerificador(cpf[..10], 11) == cpf[10] - '0';
    }

    /// <summary>Confere os dois dígitos verificadores de um CNPJ (só dígitos).</summary>
    public static bool CnpjValido(string cnpj)
    {
        if (cnpj.Length != 14 || !cnpj.All(char.IsAsciiDigit) || cnpj.Distinct().Count() == 1)
            return false;

        int[] pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        int[] pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        return DigitoCnpj(cnpj, pesos1) == cnpj[12] - '0' && DigitoCnpj(cnpj, pesos2) == cnpj[13] - '0';
    }

    /// <summary>Dígito do CPF: soma com pesos decrescentes a partir de <paramref name="pesoInicial"/>.</summary>
    private static int DigitoVerificador(string parte, int pesoInicial)
    {
        var soma = 0;
        for (var i = 0; i < parte.Length; i++)
            soma += (parte[i] - '0') * (pesoInicial - i);
        var resto = soma * 10 % 11;
        return resto == 10 ? 0 : resto;
    }

    private static int DigitoCnpj(string cnpj, int[] pesos)
    {
        var soma = 0;
        for (var i = 0; i < pesos.Length; i++)
            soma += (cnpj[i] - '0') * pesos[i];
        var resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
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
