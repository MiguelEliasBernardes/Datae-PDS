using System.Text.RegularExpressions;

namespace Backend.Servicos;

/// <summary>
/// Guarda as imagens enviadas em disco, numa pasta por evento:
/// {PastaUploads}/mural/{eventoId}/{arquivo} para as fotos do mural e
/// {PastaUploads}/banners/{eventoId}/{arquivo} para o banner da página.
/// O nome do arquivo é sempre gerado aqui (GUID aleatório), então não dá para adivinhar
/// o endereço de uma foto pendente nem escapar da pasta com "../".
/// </summary>
public partial class ArmazenamentoArquivos(IConfiguration configuracao, IWebHostEnvironment ambiente)
{
    private static readonly Dictionary<string, string> TiposConteudo = new()
    {
        [".jpg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".webp"] = "image/webp",
    };

    private string PastaUploads => Path.Combine(
        ambiente.ContentRootPath,
        configuracao["Armazenamento:PastaUploads"] is { Length: > 0 } pasta ? pasta : "Uploads");

    private string PastaMural => Path.Combine(PastaUploads, "mural");
    private string PastaBanners => Path.Combine(PastaUploads, "banners");

    // ===== Mural =====

    public Task<string> SalvarFotoMuralAsync(int eventoId, Stream conteudo, string extensao) =>
        SalvarAsync(Path.Combine(PastaMural, eventoId.ToString()), conteudo, extensao);

    /// <summary>Caminho completo e tipo da foto, ou nulo se o nome for inválido ou o arquivo não existir.</summary>
    public (string Caminho, string TipoConteudo)? AbrirFotoMural(int eventoId, string arquivo) =>
        Abrir(Path.Combine(PastaMural, eventoId.ToString()), arquivo);

    public void ExcluirFotoMural(int eventoId, string arquivo)
    {
        if (AbrirFotoMural(eventoId, arquivo) is { } foto)
            File.Delete(foto.Caminho);
    }

    // ===== Banner da página =====

    public Task<string> SalvarBannerAsync(int eventoId, Stream conteudo, string extensao) =>
        SalvarAsync(Path.Combine(PastaBanners, eventoId.ToString()), conteudo, extensao);

    /// <summary>Caminho completo e tipo do banner, ou nulo se o nome for inválido ou o arquivo não existir.</summary>
    public (string Caminho, string TipoConteudo)? AbrirBanner(int eventoId, string arquivo) =>
        Abrir(Path.Combine(PastaBanners, eventoId.ToString()), arquivo);

    public void ExcluirBanner(int eventoId, string arquivo)
    {
        if (AbrirBanner(eventoId, arquivo) is { } banner)
            File.Delete(banner.Caminho);
    }

    /// <summary>Apaga todas as imagens de um evento (chamado quando o evento é excluído).</summary>
    public void ExcluirPastaEvento(int eventoId)
    {
        foreach (var pastaBase in new[] { PastaMural, PastaBanners })
        {
            var pasta = Path.Combine(pastaBase, eventoId.ToString());
            if (Directory.Exists(pasta))
                Directory.Delete(pasta, recursive: true);
        }
    }

    /// <summary>
    /// Lê o começo do arquivo enviado e descobre se é uma imagem aceita.
    /// Devolve a extensão, ou nulo se não for uma imagem JPG, PNG, GIF ou WEBP.
    /// </summary>
    public static async Task<string?> DetectarExtensaoImagemAsync(IFormFile arquivo)
    {
        var inicio = new byte[12];
        await using var cabecalho = arquivo.OpenReadStream();
        var lidos = await cabecalho.ReadAtLeastAsync(inicio, inicio.Length, throwOnEndOfStream: false);
        return DetectarExtensaoImagem(inicio.AsSpan(0, lidos));
    }

    /// <summary>
    /// Descobre o tipo da imagem pelos primeiros bytes do arquivo (não confia no nome nem no
    /// Content-Type enviado pelo navegador). Devolve a extensão, ou nulo se não for uma imagem aceita.
    /// </summary>
    public static string? DetectarExtensaoImagem(ReadOnlySpan<byte> inicio)
    {
        if (inicio.StartsWith((byte[])[0xFF, 0xD8, 0xFF]))
            return ".jpg";
        if (inicio.StartsWith((byte[])[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))
            return ".png";
        if (inicio.StartsWith("GIF8"u8))
            return ".gif";
        if (inicio.Length >= 12 && inicio.StartsWith("RIFF"u8) && inicio[8..12].SequenceEqual("WEBP"u8))
            return ".webp";
        return null;
    }

    private static async Task<string> SalvarAsync(string pasta, Stream conteudo, string extensao)
    {
        Directory.CreateDirectory(pasta);

        var arquivo = $"{Guid.NewGuid():N}{extensao}";
        await using var destino = File.Create(Path.Combine(pasta, arquivo));
        await conteudo.CopyToAsync(destino);

        return arquivo;
    }

    private static (string Caminho, string TipoConteudo)? Abrir(string pasta, string arquivo)
    {
        if (!RegexNomeArquivo().IsMatch(arquivo))
            return null;

        var caminho = Path.Combine(pasta, arquivo);
        return File.Exists(caminho) ? (caminho, TiposConteudo[Path.GetExtension(arquivo)]) : null;
    }

    [GeneratedRegex(@"^[0-9a-f]{32}\.(jpg|png|gif|webp)$")]
    private static partial Regex RegexNomeArquivo();
}
