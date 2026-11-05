using System.Globalization;
using System.Text;
using QRCoder;

namespace Backend.Servicos;

/// <summary>
/// Monta o "Pix copia e cola" (BR Code estático) seguindo o Manual do BR Code do Banco Central
/// e gera a imagem do QR Code. Cada campo é escrito como ID (2 dígitos) + tamanho (2 dígitos) + valor.
/// </summary>
public static class GeradorPix
{
    public const int TamanhoMaximoNome = 25;
    public const int TamanhoMaximoCidade = 15;

    public static string GerarCopiaECola(string chave, string nomeRecebedor, string cidade, decimal? valor)
    {
        var contaRecebedor = Campo("00", "br.gov.bcb.pix") + Campo("01", chave);

        var payload = new StringBuilder()
            .Append(Campo("00", "01"))                    // Versão do payload
            .Append(Campo("26", contaRecebedor))          // Chave Pix
            .Append(Campo("52", "0000"))                  // Categoria do comerciante (não informada)
            .Append(Campo("53", "986"));                  // Moeda: real

        if (valor is > 0)
            payload.Append(Campo("54", valor.Value.ToString("0.00", CultureInfo.InvariantCulture)));

        payload
            .Append(Campo("58", "BR"))
            .Append(Campo("59", TextoSemAcento(nomeRecebedor, TamanhoMaximoNome)))
            .Append(Campo("60", TextoSemAcento(cidade, TamanhoMaximoCidade)))
            .Append(Campo("62", Campo("05", "***")))      // Pix estático não tem identificador de transação
            .Append("6304");                              // O CRC entra no fim e também é calculado sobre "6304"

        return payload + Crc16(payload.ToString());
    }

    /// <summary>Imagem PNG do QR Code em formato data URI, pronta para usar num &lt;img src&gt;.</summary>
    public static string GerarQrCode(string copiaECola)
    {
        var png = PngByteQRCodeHelper.GetQRCode(copiaECola, QRCodeGenerator.ECCLevel.M, 8);
        return $"data:image/png;base64,{Convert.ToBase64String(png)}";
    }

    /// <summary>O BR Code só aceita ASCII: "São João" vira "Sao Joao".</summary>
    public static string TextoSemAcento(string texto, int tamanhoMaximo)
    {
        var resultado = new StringBuilder();
        foreach (var caractere in texto.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(caractere) == UnicodeCategory.NonSpacingMark)
                continue;
            if (char.IsAsciiLetterOrDigit(caractere) || caractere is ' ' or '.' or '-' or '&')
                resultado.Append(caractere);
        }

        var limpo = Validacoes.NormalizarNome(resultado.ToString());
        return limpo.Length > tamanhoMaximo ? limpo[..tamanhoMaximo].TrimEnd() : limpo;
    }

    private static string Campo(string id, string valor) => $"{id}{valor.Length:00}{valor}";

    /// <summary>CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido pelo BR Code.</summary>
    private static string Crc16(string texto)
    {
        ushort crc = 0xFFFF;
        foreach (var b in Encoding.ASCII.GetBytes(texto))
        {
            crc ^= (ushort)(b << 8);
            for (var i = 0; i < 8; i++)
                crc = (crc & 0x8000) != 0 ? (ushort)((crc << 1) ^ 0x1021) : (ushort)(crc << 1);
        }
        return crc.ToString("X4");
    }
}
