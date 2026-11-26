using System.Text.RegularExpressions;

namespace Backend.Servicos;

/// <summary>
/// Guarda as imagens enviadas, numa "pasta" por evento:
/// mural/{eventoId}/{arquivo} para as fotos do mural e banners/{eventoId}/{arquivo} para o banner da página.
/// O nome do arquivo é sempre gerado aqui (GUID aleatório), então não dá para adivinhar
/// o endereço de uma foto pendente nem escapar da pasta com "../".
///
/// Onde os arquivos ficam depende de Armazenamento:Tipo:
/// - "Disco" (padrão): na pasta Armazenamento:PastaUploads do servidor (desenvolvimento e testes);
/// - "S3": num bucket compatível com S3 (Supabase Storage em produção), configurado em Armazenamento:S3.
/// </summary>
public sealed partial class ArmazenamentoArquivos : IDisposable
{
    private static readonly Dictionary<string, string> TiposConteudo = new()
    {
        [".jpg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".webp"] = "image/webp",
    };

    private readonly IDestinoArquivos destino;
    private readonly ILogger<ArmazenamentoArquivos> registro;

    public ArmazenamentoArquivos(IConfiguration configuracao, IWebHostEnvironment ambiente, ILogger<ArmazenamentoArquivos> registro)
    {
        this.registro = registro;
        var secao = configuracao.GetSection("Armazenamento");
        destino = (secao["Tipo"] ?? "Disco").Trim().ToUpperInvariant() switch
        {
            "S3" => CriarDestinoS3(secao.GetSection("S3")),
            "DISCO" => new DestinoDisco(Path.Combine(
                ambiente.ContentRootPath,
                secao["PastaUploads"] is { Length: > 0 } pasta ? pasta : "Uploads")),
            var tipo => throw new InvalidOperationException(
                $"Armazenamento:Tipo inválido (\"{tipo}\"). Use \"Disco\" ou \"S3\"."),
        };
    }

    /// <summary>Tipo do conteúdo pela extensão do nome gerado (ex.: "image/png").</summary>
    public static string TipoConteudo(string arquivo) => TiposConteudo[Path.GetExtension(arquivo)];

    // ===== Mural =====

    public Task<string> SalvarFotoMuralAsync(int eventoId, Stream conteudo, string extensao) =>
        SalvarAsync($"mural/{eventoId}", conteudo, extensao);

    /// <summary>Como entregar a foto, ou nulo se o nome for inválido ou ela não existir.</summary>
    public Task<ImagemGuardada?> AbrirFotoMuralAsync(int eventoId, string arquivo) =>
        AbrirAsync($"mural/{eventoId}", arquivo);

    public Task ExcluirFotoMuralAsync(int eventoId, string arquivo) => ExcluirAsync($"mural/{eventoId}", arquivo);

    // ===== Banner da página =====

    public Task<string> SalvarBannerAsync(int eventoId, Stream conteudo, string extensao) =>
        SalvarAsync($"banners/{eventoId}", conteudo, extensao);

    /// <summary>Como entregar o banner, ou nulo se o nome for inválido ou ele não existir.</summary>
    public Task<ImagemGuardada?> AbrirBannerAsync(int eventoId, string arquivo) =>
        AbrirAsync($"banners/{eventoId}", arquivo);

    public Task ExcluirBannerAsync(int eventoId, string arquivo) => ExcluirAsync($"banners/{eventoId}", arquivo);

    /// <summary>Apaga todas as imagens de um evento (chamado quando o evento é excluído).</summary>
    public async Task ExcluirPastaEventoAsync(int eventoId)
    {
        await TentarExcluirAsync($"mural/{eventoId}/", () => destino.ExcluirPrefixoAsync($"mural/{eventoId}/"));
        await TentarExcluirAsync($"banners/{eventoId}/", () => destino.ExcluirPrefixoAsync($"banners/{eventoId}/"));
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

    public void Dispose() => (destino as IDisposable)?.Dispose();

    private async Task<string> SalvarAsync(string pasta, Stream conteudo, string extensao)
    {
        var arquivo = $"{Guid.NewGuid():N}{extensao}";
        await destino.SalvarAsync($"{pasta}/{arquivo}", conteudo, TiposConteudo[extensao]);
        return arquivo;
    }

    private Task<ImagemGuardada?> AbrirAsync(string pasta, string arquivo) =>
        RegexNomeArquivo().IsMatch(arquivo) ? destino.AbrirAsync($"{pasta}/{arquivo}") : Task.FromResult<ImagemGuardada?>(null);

    private Task ExcluirAsync(string pasta, string arquivo) =>
        RegexNomeArquivo().IsMatch(arquivo)
            ? TentarExcluirAsync($"{pasta}/{arquivo}", () => destino.ExcluirAsync($"{pasta}/{arquivo}"))
            : Task.CompletedTask;

    /// <summary>
    /// As exclusões acontecem depois que o banco já foi salvo: se o arquivo não puder ser apagado
    /// (ex.: o bucket fora do ar), fica um arquivo órfão e o motivo vai para o log, sem derrubar a requisição.
    /// </summary>
    private async Task TentarExcluirAsync(string chave, Func<Task> excluir)
    {
        try
        {
            await excluir();
        }
        catch (Exception ex)
        {
            registro.LogWarning(ex, "Não foi possível apagar {Chave} do armazenamento.", chave);
        }
    }

    private static DestinoS3 CriarDestinoS3(IConfigurationSection s3)
    {
        string Obrigatorio(string chave) => Validacoes.TextoOpcional(s3[chave])
            ?? throw new InvalidOperationException($"Com Armazenamento:Tipo = \"S3\", configure Armazenamento:S3:{chave}.");

        return new DestinoS3(
            Validacoes.TextoOpcional(s3["Endpoint"]),
            Obrigatorio("Regiao"),
            Obrigatorio("Bucket"),
            Obrigatorio("ChaveAcesso"),
            Obrigatorio("ChaveSecreta"));
    }

    [GeneratedRegex(@"^[0-9a-f]{32}\.(jpg|png|gif|webp)$")]
    private static partial Regex RegexNomeArquivo();
}
