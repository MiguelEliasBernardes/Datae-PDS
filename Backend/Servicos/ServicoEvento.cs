using System.Globalization;
using System.Text;
using Backend.Dados;
using Backend.Dtos;
using Backend.Modelos;
using Microsoft.EntityFrameworkCore;
using static Backend.Servicos.Validacoes;

namespace Backend.Servicos;

public class ServicoEvento(ContextoBanco banco, ArmazenamentoArquivos armazenamento)
{
    private const int TamanhoMaximoSlug = 150;
    public const long TamanhoMaximoBannerBytes = 10 * 1024 * 1024;

    public async Task<Resultado<List<Evento>>> ListarAsync(int usuarioId)
    {
        var eventos = await banco.Eventos
            .Where(e => e.UsuarioId == usuarioId)
            .OrderBy(e => e.DataEvento)
            .ToListAsync();

        return Resultado<List<Evento>>.Ok(eventos);
    }

    public async Task<Resultado<Evento>> ObterAsync(int usuarioId, int id)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        return evento is null ? EventoNaoEncontrado() : Resultado<Evento>.Ok(evento);
    }

    public async Task<Resultado<Evento>> CriarAsync(int usuarioId, CriarEventoRequisicao requisicao)
    {
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(requisicao.NomeEvento))
            erros["nomeEvento"] = ["Informe o nome do evento."];
        if (!Enum.IsDefined(requisicao.Tipo))
            erros["tipo"] = ["Tipo de evento inválido."];
        ValidarCores(requisicao.CorPrincipal, requisicao.CorSecundaria, erros);

        if (erros.Count > 0)
            return Resultado<Evento>.Invalido(erros);

        var evento = new Evento
        {
            UsuarioId = usuarioId,
            Tipo = requisicao.Tipo,
            DataEvento = ParaUtc(requisicao.DataEvento),
            NomeEvento = requisicao.NomeEvento.Trim(),
            Local = TextoOpcional(requisicao.Local),
            Descricao = TextoOpcional(requisicao.Descricao),
            CorPrincipal = TextoOpcional(requisicao.CorPrincipal),
            CorSecundaria = TextoOpcional(requisicao.CorSecundaria),
            SlugPublico = await GerarSlugUnicoAsync(requisicao.NomeEvento),
        };

        banco.Eventos.Add(evento);
        await banco.SaveChangesAsync();

        return Resultado<Evento>.Ok(evento);
    }

    public async Task<Resultado<Evento>> AtualizarAsync(int usuarioId, int id, AtualizarEventoRequisicao requisicao)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        if (evento is null)
            return EventoNaoEncontrado();

        var erros = new Dictionary<string, string[]>();

        if (requisicao.Tipo is TipoEvento tipo)
        {
            if (!Enum.IsDefined(tipo))
                erros["tipo"] = ["Tipo de evento inválido."];
            else
                evento.Tipo = tipo;
        }

        if (requisicao.DataEvento is DateTime data)
            evento.DataEvento = ParaUtc(data);

        if (requisicao.NomeEvento is not null)
        {
            if (string.IsNullOrWhiteSpace(requisicao.NomeEvento))
                erros["nomeEvento"] = ["O nome do evento não pode ficar vazio."];
            else
                evento.NomeEvento = requisicao.NomeEvento.Trim();
        }

        if (requisicao.SlugPublico is not null)
        {
            var slug = requisicao.SlugPublico.Trim().ToLowerInvariant();
            if (slug != GerarSlugBase(slug))
                erros["slugPublico"] = ["Use apenas letras minúsculas sem acento, números e hífens."];
            else if (slug != evento.SlugPublico && await banco.Eventos.AnyAsync(e => e.SlugPublico == slug))
                return Resultado<Evento>.Falha(TipoErro.Conflito, "Este endereço já está em uso por outro evento.");
            else
                evento.SlugPublico = slug;
        }

        ValidarCores(requisicao.CorPrincipal, requisicao.CorSecundaria, erros);
        AplicarPix(evento, requisicao, erros);

        if (erros.Count > 0)
            return Resultado<Evento>.Invalido(erros);

        if (requisicao.Local is not null)
            evento.Local = TextoOpcional(requisicao.Local);
        if (requisicao.Descricao is not null)
            evento.Descricao = TextoOpcional(requisicao.Descricao);
        if (requisicao.CorPrincipal is not null)
            evento.CorPrincipal = TextoOpcional(requisicao.CorPrincipal);
        if (requisicao.CorSecundaria is not null)
            evento.CorSecundaria = TextoOpcional(requisicao.CorSecundaria);
        if (requisicao.ListaPresentesAtiva is bool listaPresentesAtiva)
            evento.ListaPresentesAtiva = listaPresentesAtiva;
        if (requisicao.MuralAtivo is bool muralAtivo)
            evento.MuralAtivo = muralAtivo;

        await banco.SaveChangesAsync();
        return Resultado<Evento>.Ok(evento);
    }

    public async Task<Resultado<bool>> ExcluirAsync(int usuarioId, int id)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        if (evento is null)
            return Resultado<bool>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");

        // Convidados, presentes e fotos do evento são excluídos junto (cascata no banco);
        // os arquivos das fotos e do banner precisam ser apagados do disco à parte
        banco.Eventos.Remove(evento);
        await banco.SaveChangesAsync();
        armazenamento.ExcluirPastaEvento(id);
        return Resultado<bool>.Ok(true);
    }

    /// <summary>Troca a imagem de capa do evento (usada no banner da página pública e no cartão do evento).</summary>
    public async Task<Resultado<Evento>> EnviarBannerAsync(int usuarioId, int id, IFormFile? arquivo)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        if (evento is null)
            return EventoNaoEncontrado();

        if (arquivo is null || arquivo.Length == 0)
            return Resultado<Evento>.Invalido(new() { ["arquivo"] = ["Escolha uma imagem para o banner."] });
        if (arquivo.Length > TamanhoMaximoBannerBytes)
            return Resultado<Evento>.Invalido(new()
            {
                ["arquivo"] = [$"A imagem pode ter no máximo {TamanhoMaximoBannerBytes / 1024 / 1024} MB."],
            });

        // Lê o começo do arquivo para conferir se é mesmo uma imagem
        var extensao = await ArmazenamentoArquivos.DetectarExtensaoImagemAsync(arquivo);
        if (extensao is null)
            return Resultado<Evento>.Invalido(new() { ["arquivo"] = ["Envie uma imagem JPG, PNG, GIF ou WEBP."] });

        var bannerAnterior = evento.Banner;
        await using (var conteudo = arquivo.OpenReadStream())
            evento.Banner = await armazenamento.SalvarBannerAsync(evento.Id, conteudo, extensao);

        await banco.SaveChangesAsync();
        if (bannerAnterior is not null)
            armazenamento.ExcluirBanner(evento.Id, bannerAnterior);

        return Resultado<Evento>.Ok(evento);
    }

    /// <summary>Remove a imagem de capa; a página volta a usar a imagem padrão.</summary>
    public async Task<Resultado<Evento>> RemoverBannerAsync(int usuarioId, int id)
    {
        var evento = await BuscarDoUsuarioAsync(usuarioId, id);
        if (evento is null)
            return EventoNaoEncontrado();

        if (evento.Banner is string banner)
        {
            evento.Banner = null;
            await banco.SaveChangesAsync();
            armazenamento.ExcluirBanner(evento.Id, banner);
        }

        return Resultado<Evento>.Ok(evento);
    }

    /// <summary>Endereço público do banner, ou nulo se o evento usa a imagem padrão.</summary>
    public static string? UrlDoBanner(Evento evento) =>
        evento.Banner is null ? null : $"/api/banners/{evento.Id}/{evento.Banner}";

    /// <summary>
    /// Dados do Pix estático. Chave vazia ("") desativa o Pix na página pública;
    /// com chave, o nome do recebedor e a cidade também são obrigatórios (o BR Code exige).
    /// </summary>
    private static void AplicarPix(Evento evento, AtualizarEventoRequisicao requisicao, Dictionary<string, string[]> erros)
    {
        if (requisicao.ChavePix is not null)
        {
            if (TextoOpcional(requisicao.ChavePix) is null)
                evento.ChavePix = null;
            else if (NormalizarChavePix(requisicao.ChavePix) is string chave)
                evento.ChavePix = chave;
            else
                erros["chavePix"] = ["Chave Pix inválida. Use CPF, CNPJ, e-mail, telefone com +55 ou chave aleatória."];
        }

        if (requisicao.NomeRecebedorPix is not null)
        {
            var nome = GeradorPix.TextoSemAcento(requisicao.NomeRecebedorPix, GeradorPix.TamanhoMaximoNome);
            evento.NomeRecebedorPix = nome.Length == 0 ? null : nome;
        }

        if (requisicao.CidadePix is not null)
        {
            var cidade = GeradorPix.TextoSemAcento(requisicao.CidadePix, GeradorPix.TamanhoMaximoCidade);
            evento.CidadePix = cidade.Length == 0 ? null : cidade;
        }

        if (evento.ChavePix is not null && !erros.ContainsKey("chavePix"))
        {
            if (evento.NomeRecebedorPix is null)
                erros["nomeRecebedorPix"] = ["Informe o nome de quem vai receber o Pix."];
            if (evento.CidadePix is null)
                erros["cidadePix"] = ["Informe a cidade de quem vai receber o Pix."];
        }
    }

    // Só encontra eventos do próprio usuário; evento de outra pessoa aparece como "não encontrado"
    private Task<Evento?> BuscarDoUsuarioAsync(int usuarioId, int id) =>
        banco.Eventos.FirstOrDefaultAsync(e => e.Id == id && e.UsuarioId == usuarioId);

    private static void ValidarCores(string? corPrincipal, string? corSecundaria, Dictionary<string, string[]> erros)
    {
        if (!CorValida(TextoOpcional(corPrincipal)))
            erros["corPrincipal"] = ["Use uma cor no formato #RRGGBB."];
        if (!CorValida(TextoOpcional(corSecundaria)))
            erros["corSecundaria"] = ["Use uma cor no formato #RRGGBB."];
    }

    /// <summary>Gera um endereço público único a partir do nome, ex.: "casamento-ana-e-pedro-2".</summary>
    private async Task<string> GerarSlugUnicoAsync(string nomeEvento)
    {
        var slugBase = GerarSlugBase(nomeEvento);
        var slug = slugBase;
        var sufixo = 2;

        while (await banco.Eventos.AnyAsync(e => e.SlugPublico == slug))
            slug = $"{slugBase}-{sufixo++}";

        return slug;
    }

    /// <summary>"Casamento de Ana & Pedro" vira "casamento-de-ana-pedro".</summary>
    private static string GerarSlugBase(string texto)
    {
        var semAcento = new StringBuilder();
        foreach (var caractere in texto.Normalize(NormalizationForm.FormD))
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
        if (resultado.Length > TamanhoMaximoSlug)
            resultado = resultado[..TamanhoMaximoSlug].Trim('-');

        return resultado.Length == 0 ? "evento" : resultado;
    }

    private static Resultado<Evento> EventoNaoEncontrado() =>
        Resultado<Evento>.Falha(TipoErro.NaoEncontrado, "Evento não encontrado.");
}
