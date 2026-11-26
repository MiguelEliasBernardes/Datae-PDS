using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;

namespace Backend.Servicos;

/// <summary>Como uma imagem guardada é entregue ao navegador: o arquivo em disco ou um link temporário.</summary>
public abstract record ImagemGuardada
{
    /// <summary>Arquivo no disco do servidor (armazenamento em disco).</summary>
    public sealed record EmDisco(string Caminho) : ImagemGuardada;

    /// <summary>Link assinado e temporário para o arquivo no bucket (armazenamento S3).</summary>
    public sealed record LinkTemporario(string Url) : ImagemGuardada;
}

/// <summary>
/// Onde os arquivos ficam de verdade. As chaves são caminhos relativos como "mural/12/{guid}.jpg";
/// quem monta e valida as chaves é a <see cref="ArmazenamentoArquivos"/>.
/// </summary>
public interface IDestinoArquivos
{
    Task SalvarAsync(string chave, Stream conteudo, string tipoConteudo);

    /// <summary>Como entregar o arquivo, ou nulo se ele não existir (no S3, não confere: o link só dá 404).</summary>
    Task<ImagemGuardada?> AbrirAsync(string chave);

    Task ExcluirAsync(string chave);

    /// <summary>Apaga todos os arquivos cuja chave começa com o prefixo (ex.: "mural/12/").</summary>
    Task ExcluirPrefixoAsync(string prefixo);
}

/// <summary>
/// Arquivos numa pasta do servidor (Armazenamento:PastaUploads, padrão "Uploads"). Usado em desenvolvimento
/// e nos testes. Em hospedagens com disco temporário (ex.: Render no plano grátis), os arquivos somem
/// a cada nova versão: em produção, use o S3.
/// </summary>
public class DestinoDisco(string pastaRaiz) : IDestinoArquivos
{
    public async Task SalvarAsync(string chave, Stream conteudo, string tipoConteudo)
    {
        var caminho = Caminho(chave);
        Directory.CreateDirectory(Path.GetDirectoryName(caminho)!);
        await using var destino = File.Create(caminho);
        await conteudo.CopyToAsync(destino);
    }

    public Task<ImagemGuardada?> AbrirAsync(string chave)
    {
        var caminho = Caminho(chave);
        return Task.FromResult<ImagemGuardada?>(File.Exists(caminho) ? new ImagemGuardada.EmDisco(caminho) : null);
    }

    public Task ExcluirAsync(string chave)
    {
        var caminho = Caminho(chave);
        if (File.Exists(caminho))
            File.Delete(caminho);
        return Task.CompletedTask;
    }

    public Task ExcluirPrefixoAsync(string prefixo)
    {
        var pasta = Caminho(prefixo.TrimEnd('/'));
        if (Directory.Exists(pasta))
            Directory.Delete(pasta, recursive: true);
        return Task.CompletedTask;
    }

    private string Caminho(string chave) => Path.Combine(pastaRaiz, chave.Replace('/', Path.DirectorySeparatorChar));
}

/// <summary>
/// Arquivos num bucket compatível com S3: Supabase Storage (o usado em produção), AWS S3 ou Cloudflare R2.
/// O bucket é privado: as imagens são entregues por links assinados que valem por algumas horas, então uma
/// foto pendente do mural continua sem endereço público.
/// </summary>
public sealed class DestinoS3 : IDestinoArquivos, IDisposable
{
    private static readonly TimeSpan ValidadeLink = TimeSpan.FromHours(6);

    private readonly AmazonS3Client cliente;
    private readonly string bucket;

    public DestinoS3(string? endpoint, string regiao, string bucket, string chaveAcesso, string chaveSecreta)
    {
        this.bucket = bucket;
        var configuracao = new AmazonS3Config
        {
            // Os serviços compatíveis com S3 (Supabase, R2) não aceitam as somas de verificação que as versões
            // novas do SDK mandam por padrão: só manda quando a operação exige
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
        };
        if (endpoint is not null)
        {
            // Supabase e R2: endereço próprio, com o bucket no caminho da URL
            configuracao.ServiceURL = endpoint;
            configuracao.ForcePathStyle = true;
            configuracao.AuthenticationRegion = regiao;
        }
        else
        {
            configuracao.RegionEndpoint = RegionEndpoint.GetBySystemName(regiao);
        }

        cliente = new AmazonS3Client(new BasicAWSCredentials(chaveAcesso, chaveSecreta), configuracao);
    }

    public async Task SalvarAsync(string chave, Stream conteudo, string tipoConteudo)
    {
        await cliente.PutObjectAsync(new PutObjectRequest
        {
            BucketName = bucket,
            Key = chave,
            InputStream = conteudo,
            ContentType = tipoConteudo,
            // O nome é um GUID novo a cada envio: a imagem nunca muda, então pode ficar em cache
            Headers = { CacheControl = "public, max-age=31536000, immutable" },
        });
    }

    public async Task<ImagemGuardada?> AbrirAsync(string chave)
    {
        // A assinatura é calculada aqui mesmo, sem chamar o serviço
        var url = await cliente.GetPreSignedURLAsync(new GetPreSignedUrlRequest
        {
            BucketName = bucket,
            Key = chave,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.Add(ValidadeLink),
        });
        return new ImagemGuardada.LinkTemporario(url);
    }

    public async Task ExcluirAsync(string chave) =>
        await cliente.DeleteObjectAsync(new DeleteObjectRequest { BucketName = bucket, Key = chave });

    public async Task ExcluirPrefixoAsync(string prefixo)
    {
        // Lista e apaga um por um: nem todo serviço compatível aceita a exclusão em lote
        string? continuacao = null;
        do
        {
            var pagina = await cliente.ListObjectsV2Async(new ListObjectsV2Request
            {
                BucketName = bucket,
                Prefix = prefixo,
                ContinuationToken = continuacao,
            });
            foreach (var objeto in pagina.S3Objects ?? [])
                await ExcluirAsync(objeto.Key);
            continuacao = pagina.IsTruncated == true ? pagina.NextContinuationToken : null;
        } while (continuacao is not null);
    }

    public void Dispose() => cliente.Dispose();
}
